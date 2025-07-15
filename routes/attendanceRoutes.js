const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const Adjustment = require("../models/Adjustment");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

router.post("/create", async (req, res) => {
  const { superAdminId, date, records } = req.body;
  try {
    const att = await Attendance.findOneAndUpdate(
      { superAdminId, date },
      { superAdminId, date, records },
      { upsert: true, new: true }
    );
    res.status(201).json({ attendance: att });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save attendance" });
  }
});

// Get all attendance for a given date
router.get("/get-by-date/:superAdminId/:date", async (req, res) => {
  try {
    const att = await Attendance.findOne({
      superAdminId: req.params.superAdminId,
      date: new Date(req.params.date),
    });
    res.json(att || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
});

// ─── MONTHLY REPORT ───────────────────────────────────────────────────────
router.get("/report/:superAdminId/:yearMonth", async (req, res) => {
  try {
    const { superAdminId, yearMonth } = req.params;
    const [year, month] = yearMonth.split("-").map(Number);
    // first/last day of month
    const start = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0).getDate();
    const end = new Date(year, month - 1, lastDay, 23, 59, 59);

    // 1) load employees
    const emps = await Employee.find({ superAdminId });

    // 2) load attendance docs in that month
    const atts = await Attendance.find({
      superAdminId,
      date: { $gte: start, $lte: end },
    });

    // 3) load adjustments in that month
    const adjs = await Adjustment.find({
      superAdminId,
      date: { $gte: start, $lte: end },
    });

    // 4) compute days in month (including Sundays)
    const daysInMonth = lastDay;

    // 5) build the report
    const report = emps.map((emp) => {
      // expected hours based on every day of month
      const monthlyHours = emp.shiftHours * daysInMonth;
      const monthlyMin = monthlyHours * 60;

      // sum actual attendance minutes, subtracting only excess break
      let attendedMin = 0;
      atts.forEach((doc) => {
        doc.records.forEach((r) => {
          if (r.empId.equals(emp._id)) {
            const toMin = (t) => {
              const [h, m] = t.split(":").map(Number);
              return h * 60 + m;
            };

            const inMins = toMin(r.inTime);
            const outMins = toMin(r.outTime);
            const breakMin = toMin(r.lunchOut) - toMin(r.lunchIn);
            const allowed = (emp.lunchHours || 0) * 60;
            const excess = Math.max(breakMin - allowed, 0);
            const workedMin = outMins - inMins - excess;

            attendedMin += workedMin;
          }
        });
      });

      const attendedHours = attendedMin / 60;
      const remainingHours = monthlyHours - attendedHours;

      // sum adjustments for this emp
      const adjTotal = adjs
        .filter((a) => a.empId.equals(emp._id))
        .reduce((sum, a) => sum + a.amount, 0);

      // prorated salary and final
      const prorated = (emp.salary * attendedMin) / monthlyMin;
      const finalSalary = prorated - adjTotal;

      return {
        empId: emp._id,
        name: emp.name,
        monthlyHours: monthlyHours.toFixed(2),
        attendedHours: attendedHours.toFixed(2),
        remainingHours: remainingHours.toFixed(2),
        baseSalary: prorated.toFixed(2),
        adjustments: adjTotal.toFixed(2),
        finalSalary: finalSalary.toFixed(2),
      };
    });

    res.json(report);
  } catch (err) {
    console.error("monthly-report error:", err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

router.get("/daily-report/:superAdminId", async (req, res) => {
  const { superAdminId } = req.params;
  const { from, to, empId } = req.query;

  try {
    const start = new Date(from);
    const end = new Date(to);
    end.setHours(23, 59, 59);

    // 1) fetch all attendance docs in range
    const docs = await Attendance.find({
      superAdminId: new ObjectId(superAdminId),
      date: { $gte: start, $lte: end },
    });

    // 2) flatten into rows
    let rows = [];
    docs.forEach((doc) => {
      const dateStr = doc.date.toISOString().slice(0, 10);
      doc.records.forEach((r) => {
        rows.push({
          date: dateStr,
          empId: r.empId.toString(),
          inTime: r.inTime,
          outTime: r.outTime,
          lunchIn: r.lunchIn,
          lunchOut: r.lunchOut,
        });
      });
    });

    // 3) optionally filter by empId
    if (empId && empId !== "all") {
      rows = rows.filter((r) => r.empId === empId);
    }

    // 4) lookup employee names & lunchHours
    const uniqueEmpIds = [...new Set(rows.map((r) => r.empId))].map(
      (id) => new ObjectId(id)
    );
    const emps = await Employee.find({ _id: { $in: uniqueEmpIds } });
    const infoMap = Object.fromEntries(
      emps.map((e) => [
        e._id.toString(),
        { name: e.name, lunchHours: e.lunchHours },
      ])
    );

    // 5) compute workedHrs
    const result = rows.map((r) => {
      const info = infoMap[r.empId] || { name: "Unknown", lunchHours: 1 };
      const toMin = (t) =>
        t.split(":").reduce((sum, n, i) => +n * (i === 0 ? 60 : 1) + sum, 0);
      const total = toMin(r.outTime) - toMin(r.inTime);
      const brk = toMin(r.lunchOut) - toMin(r.lunchIn);
      const allowed = info.lunchHours * 60;
      const worked = total - Math.max(brk - allowed, 0);
      return {
        date: r.date,
        empId: r.empId,
        employee: info.name,
        inTime: r.inTime,
        outTime: r.outTime,
        lunchIn: r.lunchIn,
        lunchOut: r.lunchOut,
        workedHrs: Number((worked / 60).toFixed(2)),
      };
    });

    res.json(result);
  } catch (err) {
    console.error("daily-report error:", err);
    res.status(500).json({ error: "Failed to generate daily report" });
  }
});

router.put("/update/:superAdminId/:date/:empId", async (req, res) => {
  const { superAdminId, date, empId } = req.params;
  const { inTime, outTime, lunchIn, lunchOut } = req.body;

  try {
    const filter = {
      superAdminId: new ObjectId(superAdminId),
      date: new Date(date),
      "records.empId": new ObjectId(empId),
    };
    const update = {
      $set: {
        "records.$.inTime": inTime,
        "records.$.outTime": outTime,
        "records.$.lunchIn": lunchIn,
        "records.$.lunchOut": lunchOut,
      },
    };

    const result = await Attendance.updateOne(filter, update);
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json({ message: "Attendance updated" });
  } catch (err) {
    console.error("attendance update failed:", err);
    res.status(500).json({ error: "Failed to update attendance" });
  }
});

// Delete a single attendance record
router.delete("/delete/:superAdminId/:date/:empId", async (req, res) => {
  const { superAdminId, date, empId } = req.params;
  try {
    const doc = await Attendance.findOne({
      superAdminId,
      date: new Date(date),
    });
    if (!doc) return res.status(404).json({ error: "Not found" });

    doc.records = doc.records.filter((r) => r.empId.toString() !== empId);
    await doc.save();
    res.json({ message: "Record deleted" });
  } catch (e) {
    console.error("Attendance delete failed:", e);
    res.status(500).json({ error: "Failed to delete attendance record" });
  }
});

/**
 * PUT /api/attendance/update-record
 * Body: { superAdminId, date, empId, inTime, outTime, lunchIn, lunchOut }
 */
router.put("/update-record", async (req, res) => {
  const { superAdminId, date, empId, inTime, outTime, lunchIn, lunchOut } =
    req.body;

  try {
    const att = await Attendance.findOne({
      superAdminId,
      date: new Date(date),
    });
    if (!att) return res.status(404).json({ error: "Attendance not found" });

    const rec = att.records.find((r) => r.empId.toString() === empId);
    if (!rec) return res.status(404).json({ error: "Record not found" });

    rec.inTime = inTime;
    rec.outTime = outTime;
    rec.lunchIn = lunchIn;
    rec.lunchOut = lunchOut;
    await att.save();

    res.json({ message: "Record updated" });
  } catch (err) {
    console.error("update-record error:", err);
    res.status(500).json({ error: "Failed to update record" });
  }
});

/**
 * DELETE /api/attendance/delete-record
 * Body: { superAdminId, date, empId }
 */
router.delete("/delete-record", async (req, res) => {
  const { superAdminId, date, empId } = req.body;

  try {
    const att = await Attendance.findOne({
      superAdminId,
      date: new Date(date),
    });
    if (!att) return res.status(404).json({ error: "Attendance not found" });

    att.records = att.records.filter((r) => r.empId.toString() !== empId);
    await att.save();

    res.json({ message: "Record deleted" });
  } catch (err) {
    console.error("delete-record error:", err);
    res.status(500).json({ error: "Failed to delete record" });
  }
});

module.exports = router;

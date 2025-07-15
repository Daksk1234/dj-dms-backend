const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");

// Create
router.post("/create", async (req, res) => {
  try {
    const emp = new Employee(req.body);
    await emp.save();
    res.status(201).json({ employee: emp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create employee" });
  }
});

// Read all for an admin
router.get("/get-all/:superAdminId", async (req, res) => {
  try {
    const emps = await Employee.find({ superAdminId: req.params.superAdminId });
    res.json(emps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

// Update
router.put("/update/:id", async (req, res) => {
  try {
    const emp = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ employee: emp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update employee" });
  }
});

// Delete
router.delete("/delete/:id", async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: "Employee deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete employee" });
  }
});

module.exports = router;

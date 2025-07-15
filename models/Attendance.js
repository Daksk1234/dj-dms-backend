const mongoose = require("mongoose");

const RecordSchema = new mongoose.Schema({
  empId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  inTime: { type: String, required: true }, // "HH:mm"
  outTime: { type: String, required: true },
  lunchIn: { type: String, required: true },
  lunchOut: { type: String, required: true },
});

const AttendanceSchema = new mongoose.Schema(
  {
    superAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperAdmin",
      required: true,
    },
    date: { type: Date, required: true },
    records: [RecordSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", AttendanceSchema);

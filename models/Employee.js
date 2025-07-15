const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema(
  {
    superAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperAdmin",
      required: true,
    },
    name: { type: String, required: true },
    designation: { type: String, required: true },
    salary: { type: Number, required: true }, // monthly salary
    shiftHours: { type: Number, required: true }, // hours per working day
    lunchHours: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", EmployeeSchema);

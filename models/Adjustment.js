const mongoose = require("mongoose");

const AdjustmentSchema = new mongoose.Schema(
  {
    superAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperAdmin",
      required: true,
    },
    empId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: { type: Date, required: true },
    description: { type: String },
    amount: { type: Number, required: true }, // positive = pay, negative = deduct
  },
  { timestamps: true }
);

module.exports = mongoose.model("Adjustment", AdjustmentSchema);

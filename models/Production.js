const mongoose = require("mongoose");

const ProductionItemSchema = new mongoose.Schema({
  product: { type: String, required: true },
  unit: { type: String },
  primaryQuantity: { type: Number, required: true },
  secondaryQuantity: { type: Number },
});

const ProductionSchema = new mongoose.Schema(
  {
    superAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperAdmin",
      required: true,
    },
    date: { type: Date, required: true },
    items: [ProductionItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Production", ProductionSchema);

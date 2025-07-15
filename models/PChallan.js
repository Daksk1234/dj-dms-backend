const mongoose = require('mongoose');

const ProductItemSchema = new mongoose.Schema({
  product: { type: String, required: true },
  unit: { type: String },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }
});

const PChallanSchema = new mongoose.Schema({
  superAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin', required: true },
  customer: { type: String, required: true },
  challanNumber: { type: String, required: true },
  date: { type: Date },
  items: [ProductItemSchema],
  total: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('PChallan', PChallanSchema);

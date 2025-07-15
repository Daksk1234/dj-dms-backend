const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  superAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SuperAdmin',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  openingQuantity: {
    type: Number,
    default: 0,
  },
  purchaseRate: {
    type: Number,
    required: true,
  },
  primaryUnit: {
    type: String,
    required: true,
  },
  secondaryUnit: {
    type: String,
  },
  secondaryQuantity: {
    type: Number,
  },
  minSalePrice: {
    type: Number,
  },
  profitPercent: {
    type: Number,
  },
});

module.exports = mongoose.model('Product', productSchema);

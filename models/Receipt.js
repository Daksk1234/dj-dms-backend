const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  superAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'SuperAdmin'
  },
  date: {
    type: Date,
    required: true,
  },
  partyName: {
    type: String,
    required: true,
  },
  paymentType: {
    type: String,
    enum: ['Party Payment', 'Expense'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  remarks: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('Receipt', receiptSchema);

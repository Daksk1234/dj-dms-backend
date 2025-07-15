const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    superAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SuperAdmin',
      required: true,
    },
    partyName: { type: String, required: true },
    partyMarka: { type: String },
    address: { type: String },
    transporterName: { type: String },
    transporterAddress: { type: String },
    paymentType: { type: String, enum: ['Cash', 'Credit'] },
    creditBalance: { type: Number },
    creditTime: { type: Number }, // in days
    openingBalance: {
      type: Number,
    },
    openingBalanceType: {
      type: String,
      enum: ['debit', 'credit'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);

const express = require('express');
const router = express.Router();
const SChallan = require('../models/SChallan');
const PChallan = require('../models/PChallan');
const Receipt = require('../models/Receipt');
const Payment = require('../models/Payment');

router.get('/party/:superAdminId/:partyName', async (req, res) => {
  try {
    const { superAdminId, partyName } = req.params;

    // Sales Challan → DEBIT
    const sales = await SChallan.find({ superAdminId, customer: partyName });
    const salesEntries = sales.map((s) => ({
      date: s.date,
      type: 'Sales Challan',
      challanNumber: s.challanNumber,
      debit: s.total ?? 0,
      credit: 0,
    }));

    // Purchase Challan → CREDIT
    const purchases = await PChallan.find({ superAdminId, customer: partyName });
    const purchaseEntries = purchases.map((p) => ({
      date: p.date,
      type: 'Purchase Challan',
      challanNumber: p.challanNumber,
      debit: 0,
      credit: p.total ?? 0,
    }));

    // Receipt → CREDIT
    const receipts = await Receipt.find({ superAdminId, partyName });
    const receiptEntries = receipts.map((r) => ({
      date: r.date,
      type: 'Receipt',
      challanNumber: '—',
      debit: 0,
      credit: r.amount ?? 0,
    }));

    // Payment → DEBIT
    const payments = await Payment.find({ superAdminId, partyName });
    const paymentEntries = payments.map((p) => ({
      date: p.date,
      type: 'Payment',
      challanNumber: '—',
      debit: p.amount ?? 0,
      credit: 0,
    }));

    const ledger = [
      ...salesEntries,
      ...purchaseEntries,
      ...receiptEntries,
      ...paymentEntries,
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(ledger);
  } catch (err) {
    console.error('Ledger error:', err);
    res.status(500).json({ error: 'Ledger fetch failed' });
  }
});

module.exports = router;

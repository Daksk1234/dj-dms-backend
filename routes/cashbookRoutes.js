const express = require('express');
const router = express.Router();
const Receipt = require('../models/Receipt');
const Payment = require('../models/Payment');

router.get('/:superAdminId', async (req, res) => {
  const { superAdminId } = req.params;
  const { from, to } = req.query;

  try {
    const dateFilter = {};
    if (from && to) {
      dateFilter.date = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
    }

    const [receipts, payments] = await Promise.all([
      Receipt.find({ superAdminId, ...dateFilter }).lean(),
      Payment.find({ superAdminId, ...dateFilter }).lean(),
    ]);

    const all = [
      ...receipts.map((entry) => ({
        date: entry.date,
        partyName: entry.partyName,
        remarks: entry.remarks || 'Receipt',
        debit: 0,
        credit: entry.amount,
        voucherType: 'Receipt',
      })),
      ...payments.map((entry) => ({
        date: entry.date,
        partyName: entry.partyName,
        remarks: entry.remarks || 'Payment',
        debit: entry.amount,
        credit: 0,
        voucherType: 'Payment',
      })),
    ];

    all.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json(all);
  } catch (err) {
    console.error('Error fetching cashbook:', err);
    res.status(500).json({ message: 'Error fetching cashbook', error: err.message });
  }
});
module.exports = router;

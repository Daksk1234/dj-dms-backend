const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');

// Create receipt
router.post('/create', async (req, res) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();
    res.status(201).json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Get all receipts by superAdminId
router.get('/get-all/:superAdminId', async (req, res) => {
  try {
    const payments = await Payment.find({ superAdminId: req.params.superAdminId }).sort({ date: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

// DELETE receipt by ID
router.delete('/delete/:id', async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Receipt deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete receipt' });
  }
});

module.exports = router;

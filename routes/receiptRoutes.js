const express = require('express');
const router = express.Router();
const Receipt = require('../models/Receipt');

// Create receipt
router.post('/create', async (req, res) => {
  try {
    const receipt = new Receipt(req.body);
    await receipt.save();
    res.status(201).json(receipt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create receipt' });
  }
});

// Get all receipts by superAdminId
router.get('/get-all/:superAdminId', async (req, res) => {
  try {
    const receipts = await Receipt.find({ superAdminId: req.params.superAdminId }).sort({ date: -1 });
    res.json(receipts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

// DELETE receipt by ID
router.delete('/delete/:id', async (req, res) => {
  try {
    await Receipt.findByIdAndDelete(req.params.id);
    res.json({ message: 'Receipt deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete receipt' });
  }
});

router.get('/total/:superAdminId/:partyName', async (req, res) => {
  const { superAdminId, partyName } = req.params;

  try {
    const receipts = await Receipt.find({ superAdminId, partyName });

    const total = receipts.reduce((sum, r) => sum + (r.amount || 0), 0);

    res.json({ total });
  } catch (err) {
    console.error('❌ Failed to fetch total receipts:', err);
    res.status(500).json({ error: 'Failed to fetch total receipt amount' });
  }
});

module.exports = router;

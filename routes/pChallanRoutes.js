const express = require('express');
const router = express.Router();
const PChallan = require('../models/PChallan');
const Product = require('../models/Product');

// Get count to generate challan number
router.get('/count/:superAdminId', async (req, res) => {
  const { superAdminId } = req.params;
  try {
    const count = await PChallan.countDocuments({ superAdminId });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch challan count' });
  }
});

// Create challan
router.post('/create', async (req, res) => {
  const { items, superAdminId } = req.body;

  try {
    const challan = new PChallan(req.body);
    await challan.save();

    res.status(201).json({ message: 'Purchase challan created', challan });
  } catch (err) {
    console.error('PChallan creation failed:', err);
    res.status(500).json({ error: 'Failed to create purchase challan' });
  }
});

router.get('/get-all/:superAdminId', async (req, res) => {
  const { superAdminId } = req.params;

  try {
    const challans = await PChallan.find({ superAdminId });
    res.json(challans);
  } catch (err) {
    console.error('Error fetching challans:', err); // 👈 add this
    res
      .status(500)
      .json({ message: 'Error fetching challans', error: err.message });
  }
});

// Delete a challan by ID
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await PChallan.findByIdAndDelete(id);
    res.json({ message: 'Challan deleted successfully' });
  } catch (err) {
    console.error('Error deleting challan:', err);
    res
      .status(500)
      .json({ message: 'Error deleting challan', error: err.message });
  }
});

module.exports = router;

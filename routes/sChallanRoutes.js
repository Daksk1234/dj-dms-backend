const express = require('express');
const router = express.Router();
const SChallan = require('../models/SChallan');
const Product = require('../models/Product');

// Get count to generate challan number
router.get('/count/:superAdminId', async (req, res) => {
  const { superAdminId } = req.params;
  try {
    const count = await SChallan.countDocuments({ superAdminId });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch challan count' });
  }
});

router.post('/create', async (req, res) => {
  const { items, superAdminId } = req.body;

  try {
    // 1. Check if stock is available for all items (optional, based on closing logic)
    for (const item of items) {
      const product = await Product.findOne({
        superAdminId,
        productName: item.product,
      });

      if (!product) {
        return res
          .status(400)
          .json({ error: `Product not found: ${item.product}` });
      }
    }

    // ✅ Just save the challan
    const challan = new SChallan(req.body);
    await challan.save();

    res.status(201).json({ message: 'Challan created', challan });
  } catch (err) {
    console.error('Challan creation failed:', err);
    res.status(500).json({ error: 'Failed to create challan' });
  }
});

router.get('/get-all/:superAdminId', async (req, res) => {
  const { superAdminId } = req.params;

  try {
    const challans = await SChallan.find({ superAdminId });
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
    await SChallan.findByIdAndDelete(id);
    res.json({ message: 'Challan deleted successfully' });
  } catch (err) {
    console.error('Error deleting challan:', err);
    res
      .status(500)
      .json({ message: 'Error deleting challan', error: err.message });
  }
});

router.get('/total/:superAdminId/:partyName', async (req, res) => {
  const { superAdminId, partyName } = req.params;

  try {
    const challans = await SChallan.find({ superAdminId, customer: partyName });

    const total = challans.reduce((sum, challan) => sum + (challan.total || 0), 0);

    res.json({ total });
  } catch (err) {
    console.error('❌ Failed to fetch total sales:', err);
    res.status(500).json({ error: 'Failed to fetch total sales amount' });
  }
});

router.get('/party/:superAdminId/:partyName', async (req, res) => {
  const { superAdminId, partyName } = req.params;
  try {
    const challans = await SChallan.find({ superAdminId, customer: partyName });
    res.json(challans);
  } catch (err) {
    console.error('❌ Error fetching challans for credit time check:', err);
    res.status(500).json({ error: 'Failed to fetch challans' });
  }
});

module.exports = router;

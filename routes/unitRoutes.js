const express = require('express');
const router = express.Router();
const Unit = require('../models/Unit');
const Product = require('../models/Product');

// Create unit
router.post('/create', async (req, res) => {
  try {
    const unit = new Unit(req.body);
    await unit.save();
    res.status(201).json(unit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create unit' });
  }
});

// Get all units
router.get('/get-all/:superAdminId', async (req, res) => {
  try {
    const units = await Unit.find({ superAdminId: req.params.superAdminId });
    res.json(units);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch units' });
  }
});

// DELETE unit by ID
router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const unit = await Unit.findById(id);
    if (!unit) return res.status(404).json({ message: 'Unit not found' });

    const usedInProduct = await Product.findOne({
      $or: [{ primaryUnit: unit.name }, { secondaryUnit: unit.name }],
    });

    if (usedInProduct) {
      return res.status(400).json({ message: 'Unit is in use and cannot be deleted' });
    }

    await Unit.findByIdAndDelete(id);
    res.json({ message: 'Unit deleted successfully' });
  } catch (err) {
    console.error('Error deleting unit:', err);
    res.status(500).json({ message: 'Error deleting unit', error: err.message });
  }
});

module.exports = router;

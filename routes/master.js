const express = require('express');
const router = express.Router();
const SuperAdmin = require('../models/SuperAdmin');
const Master = require('../models/Master');
const fs = require('fs');
require('dotenv').config();

// UPDATE super admin
router.put('/update-super-admin/:id', async (req, res) => {
  try {
    const updated = await SuperAdmin.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
});

// DELETE super admin
router.delete('/delete-super-admin/:id', async (req, res) => {
  try {
    await SuperAdmin.findByIdAndDelete(req.params.id);
    res.json({ message: 'Super admin deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const master = await Master.findOne({ email });

  if (!master || master.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // In production: create a JWT
  res.json({
    user: { id: master._id, email: master.email },
    token: 'mock-token',
  });
});

// Create Super Admin
router.post('/create-super-admin', async (req, res) => {
  try {
    const newSuperAdmin = new SuperAdmin(req.body);
    await newSuperAdmin.save();
    res.status(201).json({ message: 'Super Admin created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create Super Admin' });
  }
});

// Get all Super Admins
router.get('/super-admins', async (req, res) => {
  try {
    const superAdmins = await SuperAdmin.find().sort({ createdAt: -1 });
    res.json(superAdmins);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch super admins' });
  }
});

module.exports = router;

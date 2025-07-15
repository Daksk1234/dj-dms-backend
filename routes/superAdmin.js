const express = require('express');
const router = express.Router();
const SuperAdmin = require('../models/SuperAdmin');

// Super Admin Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await SuperAdmin.findOne({ email });

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // In production, return a JWT
  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      superAdminId: user.superAdminId,
    },
    token: 'mock-token'
  });
});

module.exports = router;

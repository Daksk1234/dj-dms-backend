const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const SChallan = require('../models/SChallan');
const PChallan = require('../models/PChallan');
const Receipt = require('../models/Receipt');
const Payment = require('../models/Payment');

// Create Customer
router.post('/create', async (req, res) => {
  try {
    const {
      superAdminId,
      partyName,
      partyMarka,
      address,
      transporterName,
      transporterAddress,
      paymentType,
      creditBalance,
      creditTime,
      openingBalance,
      openingBalanceType,
    } = req.body;

    const newCustomer = new Customer({
      superAdminId,
      partyName,
      partyMarka,
      address,
      transporterName,
      transporterAddress,
      paymentType,
      creditBalance,
      creditTime,
      openingBalance,
      openingBalanceType,
    });

    await newCustomer.save();
    res.status(201).json(newCustomer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Get All Customers by SuperAdmin
router.get('/get-all/:superAdminId', async (req, res) => {
  try {
    const customers = await Customer.find({
      superAdminId: req.params.superAdminId,
    });
    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.put('/update/:id', async (req, res) => {
  try {
    const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const customer = await Customer.findById(id);
    if (!customer)
      return res.status(404).json({ message: 'Customer not found' });

    const usedInS = await SChallan.findOne({ customer: customer.partyName });
    const usedInP = await PChallan.findOne({ customer: customer.partyName });
    const usedInR = await Receipt.findOne({ customer: customer.partyName });
    const usedInPy = await Payment.findOne({ customer: customer.partyName });

    if (usedInS || usedInP || usedInR || usedInPy) {
      return res
        .status(400)
        .json({ message: 'Customer is in use and cannot be deleted' });
    }

    await Customer.findByIdAndDelete(id);
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    console.error('Error deleting customer:', err);
    res
      .status(500)
      .json({ message: 'Error deleting customer', error: err.message });
  }
});
module.exports = router;

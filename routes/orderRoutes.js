// routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");

// Get count to generate challan number
router.get("/count/:superAdminId", async (req, res) => {
  try {
    const count = await Order.countDocuments({
      superAdminId: req.params.superAdminId,
    });
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch order count" });
  }
});

// Create new order
router.post("/create", async (req, res) => {
  const { items, superAdminId } = req.body;
  try {
    // optional: check stock for each item
    for (const itm of items) {
      const prod = await Product.findOne({
        superAdminId,
        productName: itm.product,
      });
      if (!prod) {
        return res
          .status(400)
          .json({ error: `Product not found: ${itm.product}` });
      }
    }
    const order = new Order(req.body);
    await order.save();
    res.status(201).json({ message: "Order created", order });
  } catch (err) {
    console.error("Order creation failed:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Get all orders for a super-admin
router.get("/get-all/:superAdminId", async (req, res) => {
  try {
    const orders = await Order.find({ superAdminId: req.params.superAdminId });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Error fetching orders", details: err.message });
  }
});

router.put("/update/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Find & update the order
    const updated = await Order.findByIdAndUpdate(
      id,
      {
        ...req.body,
        // ensure we don’t overwrite the timestamps
      },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json({ message: "Order updated", order: updated });
  } catch (err) {
    console.error("Error updating order:", err);
    res
      .status(500)
      .json({ error: "Failed to update order", details: err.message });
  }
});

// Delete an order by ID
router.delete("/delete/:id", async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Error deleting order", details: err.message });
  }
});

// Get total amount by customer
router.get("/total/:superAdminId/:partyName", async (req, res) => {
  try {
    const orders = await Order.find({
      superAdminId: req.params.superAdminId,
      partyName: req.params.partyName,
    });
    const total = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    res.json({ total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch total amount" });
  }
});

// Get orders by customer (for credit-time checks, etc.)
router.get("/party/:superAdminId/:partyName", async (req, res) => {
  try {
    const orders = await Order.find({
      superAdminId: req.params.superAdminId,
      partyName: req.params.partyName,
    });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders for customer" });
  }
});

module.exports = router;

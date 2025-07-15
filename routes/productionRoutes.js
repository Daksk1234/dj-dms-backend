// routes/productionRoutes.js
const express = require("express");
const router = express.Router();
const Production = require("../models/Production");
const Product = require("../models/Product");

// Create a new production record and bump inwardQuantity
router.post("/create", async (req, res) => {
  const { superAdminId, date, items } = req.body;
  try {
    // 1) Increase inwardQuantity for each product
    for (const it of items) {
      const product = await Product.findOne({
        superAdminId,
        productName: it.product,
      });
      if (!product) {
        return res
          .status(400)
          .json({ error: `Product not found: ${it.product}` });
      }
      product.inwardQty = (product.inwardQty || 0) + it.primaryQuantity;
      await product.save();
    }

    // 2) Save production entry
    const prod = new Production({ superAdminId, date, items });
    await prod.save();
    res.status(201).json({ message: "Production recorded", production: prod });
  } catch (err) {
    console.error("Production creation failed:", err);
    res.status(500).json({ error: "Failed to record production" });
  }
});

// Get all production records
router.get("/get-all/:superAdminId", async (req, res) => {
  try {
    const records = await Production.find({
      superAdminId: req.params.superAdminId,
    }).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    console.error("Error fetching production records:", err);
    res.status(500).json({ error: "Failed to fetch production records" });
  }
});

// Update a production record (revert old + apply new inwardQuantity)
router.put("/update/:id", async (req, res) => {
  const { id } = req.params;
  const { date, items } = req.body;
  try {
    const prod = await Production.findById(id);
    if (!prod) return res.status(404).json({ error: "Production not found" });

    // 1) Subtract old quantities
    for (const it of prod.items) {
      const product = await Product.findOne({
        superAdminId: prod.superAdminId,
        productName: it.product,
      });
      if (product) {
        product.inwardQuantity =
          (product.inwardQuantity || 0) - it.primaryQuantity;
        await product.save();
      }
    }

    // 2) Add new quantities
    for (const it of items) {
      const product = await Product.findOne({
        superAdminId: prod.superAdminId,
        productName: it.product,
      });
      if (!product) {
        return res
          .status(400)
          .json({ error: `Product not found: ${it.product}` });
      }
      product.inwardQuantity =
        (product.inwardQuantity || 0) + it.primaryQuantity;
      await product.save();
    }

    // 3) Persist updated production
    prod.date = date;
    prod.items = items;
    await prod.save();

    res.json({ message: "Production updated", production: prod });
  } catch (err) {
    console.error("Production update failed:", err);
    res.status(500).json({ error: "Failed to update production" });
  }
});

// Delete a production record (subtract its quantities)
router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const prod = await Production.findById(id);
    if (!prod) return res.status(404).json({ error: "Production not found" });

    // Revert inwardQuantity
    for (const it of prod.items) {
      const product = await Product.findOne({
        superAdminId: prod.superAdminId,
        productName: it.product,
      });
      if (product) {
        product.inwardQuantity =
          (product.inwardQuantity || 0) - it.primaryQuantity;
        await product.save();
      }
    }

    await Production.findByIdAndDelete(id);
    res.json({ message: "Production deleted" });
  } catch (err) {
    console.error("Production delete failed:", err);
    res.status(500).json({ error: "Failed to delete production" });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const PChallan = require('../models/PChallan');
const SChallan = require('../models/SChallan');

// Create product
router.post('/create', async (req, res) => {
  try {
    const product = new Product(req.body);
    const saved = await product.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Get products by superAdminId
router.get('/get-all/:superAdminId', async (req, res) => {
  try {
    const products = await Product.find({
      superAdminId: req.params.superAdminId,
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.put('/update/:id', async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        productName: req.body.productName,
        openingQuantity: req.body.openingQuantity,
        rate: req.body.rate,
        primaryUnit: req.body.primaryUnit,
        secondaryUnit: req.body.secondaryUnit,
        secondaryQty: req.body.secondaryQty,
      },
      { new: true }
    );
    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const usedInS = await SChallan.findOne({ 'items.product': product.productName });
    const usedInP = await PChallan.findOne({ 'items.product': product.productName });

    if (usedInS || usedInP) {
      return res.status(400).json({ message: 'Product is in use and cannot be deleted' });
    }

    await Product.findByIdAndDelete(id);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
});

router.put('/update-min-price/:productId', async (req, res) => {
  const { productId } = req.params;
  const { minSalePrice, profitPercent, superAdminId } = req.body;

  try {
    const product = await Product.findOne({ _id: productId, superAdminId });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.minSalePrice = minSalePrice;
    product.profitPercent = profitPercent;
    await product.save();

    res.json({
      message: 'Updated successfully',
      minSalePrice,
      profitPercent,
    });
  } catch (err) {
    console.error('❌ Update failed:', err);
    res.status(500).json({ error: 'Update failed', details: err.message });
  }
});
module.exports = router;

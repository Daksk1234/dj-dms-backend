const express = require("express");
const router = express.Router();
const Adjustment = require("../models/Adjustment");

// Create
router.post("/create", async (req, res) => {
  try {
    const adj = new Adjustment(req.body);
    await adj.save();
    res.status(201).json({ adjustment: adj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create adjustment" });
  }
});

// Get all for admin
router.get("/get-all/:superAdminId", async (req, res) => {
  try {
    const list = await Adjustment.find({
      superAdminId: req.params.superAdminId,
    });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch adjustments" });
  }
});

// Update
router.put("/update/:id", async (req, res) => {
  try {
    const adj = await Adjustment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ adjustment: adj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update adjustment" });
  }
});

// Delete
router.delete("/delete/:id", async (req, res) => {
  try {
    await Adjustment.findByIdAndDelete(req.params.id);
    res.json({ message: "Adjustment deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete adjustment" });
  }
});

module.exports = router;

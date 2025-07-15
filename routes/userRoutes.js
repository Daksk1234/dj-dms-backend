const express = require("express");
const router = express.Router();
const User = require("../models/User");

// CREATE
router.post("/create", async (req, res) => {
  const { superAdminId, name, email, password, phoneNumber, role } = req.body;
  try {
    if (await User.findOne({ email })) {
      return res.status(400).json({ error: "Email already in use" });
    }
    const u = new User({
      superAdminId,
      name,
      email,
      password,
      phoneNumber,
      role,
    });
    await u.save();
    const obj = u.toObject();
    delete obj.password;
    res.status(201).json({ message: "User created", user: obj });
  } catch (err) {
    console.error("Error creating user:", err);
    res
      .status(500)
      .json({ error: "Failed to create user", details: err.message });
  }
});

// READ all for this superAdmin
router.get("/get-all/:superAdminId", async (req, res) => {
  try {
    const users = await User.find({
      superAdminId: req.params.superAdminId,
    }).select("-password");
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch users", details: err.message });
  }
});

// READ single
router.get("/get/:id", async (req, res) => {
  try {
    const u = await User.findById(req.params.id).select("-password");
    if (!u) return res.status(404).json({ error: "User not found" });
    res.json(u);
  } catch (err) {
    console.error("Error fetching user:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch user", details: err.message });
  }
});

// UPDATE
router.put("/update/:id", async (req, res) => {
  try {
    const { name, email, password, phoneNumber, role } = req.body;
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ error: "User not found" });

    u.name = name;
    u.email = email;
    u.phoneNumber = phoneNumber;
    u.role = role;
    if (password) u.password = password;

    await u.save();
    const obj = u.toObject();
    delete obj.password;
    res.json({ message: "User updated", user: obj });
  } catch (err) {
    console.error("Error updating user:", err);
    res
      .status(500)
      .json({ error: "Failed to update user", details: err.message });
  }
});

// DELETE
router.delete("/delete/:id", async (req, res) => {
  try {
    const u = await User.findByIdAndDelete(req.params.id);
    if (!u) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res
      .status(500)
      .json({ error: "Failed to delete user", details: err.message });
  }
});

// LOGIN for Manager & Billing Staff
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    // find by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // compare hashed password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // In production, issue a JWT – for now return mock‐token
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        superAdminId: user.superAdminId,
      },
      token: "mock-token",
    });
  } catch (err) {
    console.error("User login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

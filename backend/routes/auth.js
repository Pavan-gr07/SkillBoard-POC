const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Institution = require("../models/Institution");
const { protect } = require("../middleware/auth");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role, institution_name, institution_id } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password, and role are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    let instId = null;

    // If role is "institution", create a new institution record
    if (role === "institution") {
      if (!institution_name) {
        return res.status(400).json({ message: "Institution name is required for this role" });
      }
      // Create user first (without instId), then create institution
      const user = await User.create({ name, email, password, role });
      const institution = await Institution.create({ name: institution_name, admin_id: user._id });
      user.institution_id = institution._id;
      await user.save();
      const token = signToken(user._id);
      return res.status(201).json({ token, user, institution });
    }

    // Trainer / Student: optionally associate with institution via institution_id
    if (role === "trainer" || role === "student") {
      if (institution_id) instId = institution_id;
    }

    const user = await User.create({ name, email, password, role, institution_id: instId });
    const token = signToken(user._id);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("institution_id");
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/auth/profile — Update name
router.patch("/profile", protect, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "Name is required" });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim() },
      { new: true }
    ).populate("institution_id");
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/auth/password — Change password
router.patch("/password", protect, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password)
      return res.status(400).json({ message: "Both current and new password are required" });
    if (new_password.length < 6)
      return res.status(400).json({ message: "New password must be at least 6 characters" });

    // Fetch user with password field
    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.comparePassword(current_password);
    if (!isMatch) return res.status(401).json({ message: "Current password is incorrect" });

    user.password = new_password;
    await user.save(); // triggers bcrypt hash in pre-save hook

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

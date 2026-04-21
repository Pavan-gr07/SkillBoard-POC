const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth");
const Attendance = require("../models/Attendance");
const Session = require("../models/Session");
const Batch = require("../models/Batch");

// POST /api/attendance/mark — Student marks own attendance
router.post("/mark", protect, restrictTo("student"), async (req, res) => {
  try {
    const { session_id, status = "present" } = req.body;
    if (!session_id) return res.status(400).json({ message: "session_id is required" });

    const session = await Session.findById(session_id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    // Verify student is in the batch
    const batch = await Batch.findById(session.batch_id);
    if (!batch || !batch.students.includes(req.user._id)) {
      return res.status(403).json({ message: "You are not enrolled in this batch" });
    }

    // Check if already marked
    const existing = await Attendance.findOne({
      session_id,
      student_id: req.user._id,
    });
    if (existing) {
      return res.status(409).json({ message: "Attendance already marked", attendance: existing });
    }

    const attendance = await Attendance.create({
      session_id,
      student_id: req.user._id,
      status,
      marked_at: new Date(),
    });

    res.status(201).json({ attendance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/attendance/my — Student sees their own attendance history
router.get("/my", protect, restrictTo("student"), async (req, res) => {
  try {
    const attendance = await Attendance.find({ student_id: req.user._id })
      .populate({
        path: "session_id",
        populate: { path: "batch_id", select: "name" },
      })
      .sort({ marked_at: -1 });
    res.json({ attendance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

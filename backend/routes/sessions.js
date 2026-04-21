const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth");
const Session = require("../models/Session");
const Batch = require("../models/Batch");
const Attendance = require("../models/Attendance");

// POST /api/sessions — Trainer creates a session
router.post("/", protect, restrictTo("trainer"), async (req, res) => {
  try {
    const { batch_id, title, date, start_time, end_time } = req.body;
    if (!batch_id || !title || !date || !start_time || !end_time) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const batch = await Batch.findById(batch_id);
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    const session = await Session.create({
      batch_id,
      trainer_id: req.user._id,
      title,
      date,
      start_time,
      end_time,
    });

    res.status(201).json({ session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/sessions — Get sessions based on role
router.get("/", protect, async (req, res) => {
  try {
    let sessions;
    if (req.user.role === "trainer") {
      sessions = await Session.find({ trainer_id: req.user._id })
        .populate("batch_id", "name")
        .sort({ date: -1 });
    } else if (req.user.role === "student") {
      // Find batches student belongs to
      const batches = await Batch.find({ students: req.user._id });
      const batchIds = batches.map((b) => b._id);
      sessions = await Session.find({ batch_id: { $in: batchIds } })
        .populate("batch_id", "name")
        .populate("trainer_id", "name")
        .sort({ date: -1 });
    } else if (["institution", "programme_manager", "monitoring_officer"].includes(req.user.role)) {
      sessions = await Session.find()
        .populate("batch_id", "name")
        .populate("trainer_id", "name")
        .sort({ date: -1 });
    }
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/sessions/:id/attendance — Trainer views full attendance for a session
router.get(
  "/:id/attendance",
  protect,
  restrictTo("trainer", "institution", "programme_manager", "monitoring_officer"),
  async (req, res) => {
    try {
      const session = await Session.findById(req.params.id)
        .populate("batch_id")
        .populate("trainer_id", "name");
      if (!session) return res.status(404).json({ message: "Session not found" });

      const attendance = await Attendance.find({ session_id: session._id }).populate(
        "student_id",
        "name email"
      );

      // Get all students in the batch
      const batch = await Batch.findById(session.batch_id).populate("students", "name email");
      const markedIds = attendance.map((a) => a.student_id._id.toString());

      const allStudents = batch.students.map((student) => {
        const record = attendance.find(
          (a) => a.student_id._id.toString() === student._id.toString()
        );
        return {
          student_id: student._id,
          name: student.name,
          email: student.email,
          status: record ? record.status : "absent",
          marked_at: record ? record.marked_at : null,
        };
      });

      res.json({ session, attendance: allStudents });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;

const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth");
const Batch = require("../models/Batch");
const User = require("../models/User");
const { nanoid } = require("nanoid");

// POST /api/batches — Trainer or Institution creates a batch
router.post(
  "/",
  protect,
  restrictTo("trainer", "institution"),
  async (req, res) => {
    try {
      const { name, institution_id } = req.body;
      if (!name) return res.status(400).json({ message: "Batch name is required" });

      let instId = institution_id;
      if (req.user.role === "institution") {
        instId = req.user.institution_id;
      }
      if (!instId) return res.status(400).json({ message: "Institution ID is required" });

      const batch = await Batch.create({
        name,
        institution_id: instId,
        trainers: req.user.role === "trainer" ? [req.user._id] : [],
      });

      res.status(201).json({ batch });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// POST /api/batches/:id/invite — Trainer generates invite link
router.post(
  "/:id/invite",
  protect,
  restrictTo("trainer", "institution"),
  async (req, res) => {
    try {
      const batch = await Batch.findById(req.params.id);
      if (!batch) return res.status(404).json({ message: "Batch not found" });

      // Generate or reuse invite token
      if (!batch.invite_token) {
        batch.invite_token = nanoid(12);
        await batch.save();
      }

      const inviteLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/join/${batch.invite_token}`;
      res.json({ invite_token: batch.invite_token, invite_link: inviteLink });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// POST /api/batches/:id/join — Student joins via invite token
router.post(
  "/:id/join",
  protect,
  restrictTo("student"),
  async (req, res) => {
    try {
      const { invite_token } = req.body;
      const batch = await Batch.findOne({ invite_token });
      if (!batch) return res.status(404).json({ message: "Invalid invite link" });

      if (batch.students.includes(req.user._id)) {
        return res.status(409).json({ message: "Already enrolled in this batch" });
      }

      batch.students.push(req.user._id);
      await batch.save();

      // Also update user's institution_id if not set
      if (!req.user.institution_id) {
        await User.findByIdAndUpdate(req.user._id, { institution_id: batch.institution_id });
      }

      res.json({ message: "Joined batch successfully", batch });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// POST /api/batches/:id/trainers — Institution assigns a trainer to a batch
router.post(
  "/:id/trainers",
  protect,
  restrictTo("institution"),
  async (req, res) => {
    try {
      const { trainer_id, trainer_email } = req.body;
      let trainer;
      if (trainer_id) {
        trainer = await User.findById(trainer_id);
      } else if (trainer_email) {
        trainer = await User.findOne({ email: trainer_email, role: "trainer" });
      }
      if (!trainer || trainer.role !== "trainer") {
        return res.status(404).json({ message: "Trainer not found" });
      }

      const batch = await Batch.findById(req.params.id);
      if (!batch) return res.status(404).json({ message: "Batch not found" });

      // Verify batch belongs to this institution
      if (batch.institution_id.toString() !== req.user.institution_id.toString()) {
        return res.status(403).json({ message: "Batch does not belong to your institution" });
      }

      if (!batch.trainers.includes(trainer._id)) {
        batch.trainers.push(trainer._id);
        await batch.save();
      }

      // Also link trainer to this institution if not already set
      if (!trainer.institution_id) {
        trainer.institution_id = req.user.institution_id;
        await trainer.save();
      }

      res.json({ message: "Trainer assigned to batch", batch });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// DELETE /api/batches/:id/trainers/:trainerId — Remove trainer from batch
router.delete(
  "/:id/trainers/:trainerId",
  protect,
  restrictTo("institution"),
  async (req, res) => {
    try {
      const batch = await Batch.findById(req.params.id);
      if (!batch) return res.status(404).json({ message: "Batch not found" });
      batch.trainers = batch.trainers.filter(
        (t) => t.toString() !== req.params.trainerId
      );
      await batch.save();
      res.json({ message: "Trainer removed from batch" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

router.get("/", protect, async (req, res) => {
  try {
    let batches;
    if (req.user.role === "trainer") {
      batches = await Batch.find({ trainers: req.user._id })
        .populate("institution_id", "name")
        .populate("trainers", "name email")
        .populate("students", "name email");
    } else if (req.user.role === "institution") {
      batches = await Batch.find({ institution_id: req.user.institution_id })
        .populate("trainers", "name email")
        .populate("students", "name email");
    } else if (["programme_manager", "monitoring_officer"].includes(req.user.role)) {
      batches = await Batch.find()
        .populate("institution_id", "name")
        .populate("trainers", "name email")
        .populate("students", "name email");
    } else if (req.user.role === "student") {
      batches = await Batch.find({ students: req.user._id })
        .populate("institution_id", "name")
        .populate("trainers", "name email");
    } else {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json({ batches });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/batches/:id/summary — Institution views attendance summary for a batch
router.get(
  "/:id/summary",
  protect,
  restrictTo("institution", "programme_manager", "monitoring_officer"),
  async (req, res) => {
    try {
      const Session = require("../models/Session");
      const Attendance = require("../models/Attendance");

      const batch = await Batch.findById(req.params.id)
        .populate("students", "name email")
        .populate("trainers", "name email");
      if (!batch) return res.status(404).json({ message: "Batch not found" });

      const sessions = await Session.find({ batch_id: batch._id });
      const sessionIds = sessions.map((s) => s._id);

      const attendance = await Attendance.find({ session_id: { $in: sessionIds } });

      const summary = {
        batch_name: batch.name,
        total_sessions: sessions.length,
        total_students: batch.students.length,
        students: batch.students.map((student) => {
          const studentAttendance = attendance.filter(
            (a) => a.student_id.toString() === student._id.toString()
          );
          const present = studentAttendance.filter((a) => a.status === "present").length;
          const late = studentAttendance.filter((a) => a.status === "late").length;
          return {
            student_id: student._id,
            name: student.name,
            email: student.email,
            present,
            late,
            absent: sessions.length - studentAttendance.length,
            attendance_rate: sessions.length
              ? (((present + late) / sessions.length) * 100).toFixed(1)
              : 0,
          };
        }),
      };

      res.json({ summary });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /api/batches/join/:token — Get batch info from token (for join page)
router.get("/join/:token", protect, async (req, res) => {
  try {
    const batch = await Batch.findOne({ invite_token: req.params.token })
      .populate("institution_id", "name")
      .populate("trainers", "name");
    if (!batch) return res.status(404).json({ message: "Invalid invite link" });
    res.json({ batch });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

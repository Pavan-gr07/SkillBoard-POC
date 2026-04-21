const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth");
const Institution = require("../models/Institution");
const User = require("../models/User");
const Batch = require("../models/Batch");
const Session = require("../models/Session");
const Attendance = require("../models/Attendance");

// GET /api/institutions — List institutions
router.get(
  "/",
  protect,
  restrictTo("programme_manager", "monitoring_officer", "institution"),
  async (req, res) => {
    try {
      let institutions;
      if (req.user.role === "institution") {
        institutions = await Institution.find({ _id: req.user.institution_id });
      } else {
        institutions = await Institution.find().populate("admin_id", "name email");
      }
      res.json({ institutions });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /api/institutions/:id/summary — Programme Manager summary across all batches
router.get(
  "/:id/summary",
  protect,
  restrictTo("programme_manager", "monitoring_officer", "institution"),
  async (req, res) => {
    try {
      const institution = await Institution.findById(req.params.id);
      if (!institution) return res.status(404).json({ message: "Institution not found" });

      const batches = await Batch.find({ institution_id: institution._id }).populate(
        "students",
        "name"
      );
      const batchIds = batches.map((b) => b._id);
      const sessions = await Session.find({ batch_id: { $in: batchIds } });
      const sessionIds = sessions.map((s) => s._id);
      const attendance = await Attendance.find({ session_id: { $in: sessionIds } });

      const trainers = await User.find({
        role: "trainer",
        institution_id: institution._id,
      }).select("name email");

      const batchSummaries = batches.map((batch) => {
        const batchSessions = sessions.filter(
          (s) => s.batch_id.toString() === batch._id.toString()
        );
        const batchSessionIds = batchSessions.map((s) => s._id.toString());
        const batchAttendance = attendance.filter((a) =>
          batchSessionIds.includes(a.session_id.toString())
        );
        const present = batchAttendance.filter((a) => a.status !== "absent").length;
        const total = batchSessions.length * batch.students.length;
        return {
          batch_id: batch._id,
          batch_name: batch.name,
          total_students: batch.students.length,
          total_sessions: batchSessions.length,
          overall_attendance_rate: total ? ((present / total) * 100).toFixed(1) : 0,
        };
      });

      res.json({
        institution: institution.name,
        total_batches: batches.length,
        total_trainers: trainers.length,
        trainers,
        batches: batchSummaries,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// POST /api/institutions/:id/trainers — Institution assigns a trainer
router.post(
  "/:id/trainers",
  protect,
  restrictTo("institution"),
  async (req, res) => {
    try {
      const { trainer_email } = req.body;
      const trainer = await User.findOne({ email: trainer_email, role: "trainer" });
      if (!trainer) return res.status(404).json({ message: "Trainer not found" });

      trainer.institution_id = req.params.id;
      await trainer.save();
      res.json({ message: "Trainer assigned", trainer });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;

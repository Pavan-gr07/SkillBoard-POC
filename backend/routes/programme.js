const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth");
const Institution = require("../models/Institution");
const Batch = require("../models/Batch");
const Session = require("../models/Session");
const Attendance = require("../models/Attendance");
const User = require("../models/User");

// GET /api/programme/summary — Programme-wide summary
router.get(
  "/summary",
  protect,
  restrictTo("programme_manager", "monitoring_officer"),
  async (req, res) => {
    try {
      const institutions = await Institution.find();
      const batches = await Batch.find();
      const sessions = await Session.find();
      const sessionIds = sessions.map((s) => s._id);
      const attendance = await Attendance.find({ session_id: { $in: sessionIds } });

      const totalStudents = await User.countDocuments({ role: "student" });
      const totalTrainers = await User.countDocuments({ role: "trainer" });

      const present = attendance.filter((a) => a.status !== "absent").length;
      const totalPossible = sessions.reduce(async () => {}, 0); // calculated per batch

      // Per-institution breakdown
      const institutionBreakdown = await Promise.all(
        institutions.map(async (inst) => {
          const instBatches = batches.filter(
            (b) => b.institution_id.toString() === inst._id.toString()
          );
          const instBatchIds = instBatches.map((b) => b._id.toString());
          const instSessions = sessions.filter((s) =>
            instBatchIds.includes(s.batch_id.toString())
          );
          const instSessionIds = instSessions.map((s) => s._id.toString());
          const instAttendance = attendance.filter((a) =>
            instSessionIds.includes(a.session_id.toString())
          );
          const instPresent = instAttendance.filter((a) => a.status !== "absent").length;
          const instTotal = instAttendance.length;
          return {
            institution_id: inst._id,
            institution_name: inst.name,
            total_batches: instBatches.length,
            total_sessions: instSessions.length,
            attendance_marked: instTotal,
            present: instPresent,
            attendance_rate: instTotal ? ((instPresent / instTotal) * 100).toFixed(1) : 0,
          };
        })
      );

      res.json({
        total_institutions: institutions.length,
        total_batches: batches.length,
        total_sessions: sessions.length,
        total_students: totalStudents,
        total_trainers: totalTrainers,
        total_attendance_records: attendance.length,
        overall_present: present,
        overall_attendance_rate: attendance.length
          ? ((present / attendance.length) * 100).toFixed(1)
          : 0,
        institutions: institutionBreakdown,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;

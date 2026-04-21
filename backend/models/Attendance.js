const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    session_id: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["present", "absent", "late"], default: "present" },
    marked_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent duplicate attendance records
attendanceSchema.index({ session_id: 1, student_id: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);

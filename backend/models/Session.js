const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    batch_id: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
    trainer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    start_time: { type: String, required: true }, // "HH:MM"
    end_time: { type: String, required: true },   // "HH:MM"
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);

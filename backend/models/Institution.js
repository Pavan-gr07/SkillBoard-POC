const mongoose = require("mongoose");

const institutionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    admin_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    region: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Institution", institutionSchema);

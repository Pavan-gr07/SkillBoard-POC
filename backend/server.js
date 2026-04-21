const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const serverless = require("serverless-http");
// NEW

dotenv.config();

const app = express();


// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://main.d21q41489vwpur.amplifyapp.com"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/batches", require("./routes/batches"));
app.use("/api/sessions", require("./routes/sessions"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/institutions", require("./routes/institutions"));
app.use("/api/programme", require("./routes/programme"));

// Health check
app.get("/", (req, res) => {
  res.json({ message: "SkillBridge API is running", status: "ok" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error", error: err.message });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    // app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
// --------------------
// Lambda handler
// --------------------
module.exports.handler = serverless(app, {
  request: (req, event, context) => {
    if (Buffer.isBuffer(req.body)) {
      try {
        const str = req.body.toString();
        // Only parse if it starts with { or [
        if (str.trim().startsWith('{') || str.trim().startsWith('[')) {
          req.body = JSON.parse(str);
        }
      } catch (err) {
        console.error("❌ Failed to parse request body:", err.message);
        req.body = {}; // fallback to avoid crashing
      }
    }
  }
});

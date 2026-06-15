// src/index.js
// LinkShelf API — Express Server Entry Point

require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Import routes
const authRoutes = require("./routes/auth");
const bookmarkRoutes = require("./routes/bookmarks");
const healthRoutes = require("./routes/health");

// ============================================================
// Validate required env vars at startup
// (Lesson from 8.5 — always validate before booting)
// ============================================================
function validateEnv() {
  const required = ["DATABASE_URL", "JWT_SECRET"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `❌ FATAL: Missing required environment variables: ${missing.join(", ")}`
    );
    process.exit(1);
  }
  console.log("✅ All required environment variables are set.");
}

validateEnv();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// CORS configuration
//
// IMPORTANT:
// - We cannot use origin: "*" when sending credentials (cookies).
// - Browsers will reject "*" with credentials: true.
// - Instead, we read the allowed origin from process.env.CORS_ORIGIN,
//   which is set in render.yaml for the backend service.
// ============================================================
const allowedOrigin = process.env.CORS_ORIGIN;

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bookmarks", bookmarkRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    name: "LinkShelf API",
    version: "1.0.0",
    docs: "/api/health",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 LinkShelf API running on port ${PORT}`);
});
require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Routes
const usersRoute = require("./routes/users");
const bookingsRoute = require("./routes/bookings");
const paymentsRoute = require("./routes/payments");
const testVoiceRoute = require("./routes/testVoice");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend connected successfully!",
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use("/api/users", usersRoute);
app.use("/api/bookings", bookingsRoute);
app.use("/api/payments", paymentsRoute);
app.use("/api/test-voice", testVoiceRoute);

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Backend Server running on http://localhost:${PORT}`);
});

server.on("error", (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
  } else {
    console.error("Server error:", error);
  }
});

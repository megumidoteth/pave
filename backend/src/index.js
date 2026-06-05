const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();
const { startIndexer } = require("./services/indexer");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Pave API is running",
    network: "Arc Testnet",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/invoices", require("./routes/invoices"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Pave API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);

  // Start Arc event indexer
  startIndexer();
});

module.exports = app;

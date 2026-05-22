/**
 * server.js
 * Entry point for the Watchdog Sentinel API.
 * Run with: npm start
 */

const express = require("express");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check (useful for container orchestration)
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Mount all monitor routes
app.use("/", routes);

// 404 fallback
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Watchdog Sentinel running on http://localhost:${PORT}`);
});

module.exports = app;

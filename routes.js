/**
 * routes.js
 * All HTTP route definitions for the Watchdog Sentinel API.
 */

const { Router } = require("express");
const monitors = require("./monitors");

const router = Router();

// ── POST /monitors ─────────────────────────────────────────────────────────
// Register a new device monitor.
router.post("/monitors", (req, res) => {
  const { id, timeout, alert_email } = req.body;

  if (!id || typeof id !== "string" || !id.trim()) {
    return res.status(400).json({ error: "id is required and must be a non-empty string" });
  }
  if (!timeout || typeof timeout !== "number" || timeout <= 0) {
    return res.status(400).json({ error: "timeout is required and must be a positive number (seconds)" });
  }
  if (!alert_email || typeof alert_email !== "string") {
    return res.status(400).json({ error: "alert_email is required" });
  }

  const result = monitors.create({ id: id.trim(), timeout, alert_email });

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(201).json({
    message: `Monitor for '${id}' created. Countdown started: ${timeout}s.`,
    monitor: monitors.safeView(result.monitor),
  });
});

// ── POST /monitors/:id/heartbeat ───────────────────────────────────────────
// Reset the countdown for a device. Un-pauses a paused monitor.
router.post("/monitors/:id/heartbeat", (req, res) => {
  const result = monitors.heartbeat(req.params.id);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(200).json({
    message: `Heartbeat received. Timer reset to ${result.monitor.timeout}s.`,
    monitor: monitors.safeView(result.monitor),
  });
});

// ── POST /monitors/:id/pause ───────────────────────────────────────────────
// Suspend monitoring. No alerts will fire while paused.
router.post("/monitors/:id/pause", (req, res) => {
  const result = monitors.pause(req.params.id);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(200).json({
    message: `Monitor '${req.params.id}' paused. No alerts will fire.`,
    monitor: monitors.safeView(result.monitor),
  });
});

// ── GET /monitors/:id ─────────────────────────────────────────────────────
// (Developer's Choice) Query the current state of any monitor.
router.get("/monitors/:id", (req, res) => {
  const result = monitors.get(req.params.id);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(200).json({ monitor: monitors.safeView(result.monitor) });
});

// ── DELETE /monitors/:id ──────────────────────────────────────────────────
// Remove a monitor entirely (e.g., device decommissioned).
router.delete("/monitors/:id", (req, res) => {
  const result = monitors.remove(req.params.id);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(200).json({ message: `Monitor '${result.deleted}' deleted.` });
});

// ── GET /monitors ─────────────────────────────────────────────────────────
// List all registered monitors and their current status.
router.get("/monitors", (_req, res) => {
  return res.status(200).json({ monitors: monitors.list() });
});

module.exports = router;

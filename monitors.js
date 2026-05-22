/**
 * monitors.js
 * In-memory store for all monitors plus timer management.
 * Each monitor is a plain object:
 *   { id, timeout, alert_email, status, timer, createdAt, updatedAt, lastHeartbeat }
 *
 * status values: "active" | "paused" | "down"
 */

const store = new Map();

function fireAlert(id) {
  const monitor = store.get(id);
  if (!monitor) return;

  monitor.status = "down";
  monitor.timer = null;
  monitor.updatedAt = new Date().toISOString();

  const alert = {
    ALERT: `Device ${id} is down!`,
    alert_email: monitor.alert_email,
    time: new Date().toISOString(),
  };

  console.error(JSON.stringify(alert));
  // In production, replace the log above with a real email/webhook call.
}

function startTimer(monitor) {
  clearTimer(monitor);
  monitor.timer = setTimeout(() => {
    fireAlert(monitor.id);
  }, monitor.timeout * 1000);
}

function clearTimer(monitor) {
  if (monitor.timer) {
    clearTimeout(monitor.timer);
    monitor.timer = null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

function create({ id, timeout, alert_email }) {
  if (store.has(id)) {
    return { error: "Monitor already exists", status: 409 };
  }

  const now = new Date().toISOString();
  const monitor = {
    id,
    timeout,
    alert_email,
    status: "active",
    timer: null,
    createdAt: now,
    updatedAt: now,
    lastHeartbeat: null,
  };

  store.set(id, monitor);
  startTimer(monitor);

  return { monitor };
}

function heartbeat(id) {
  const monitor = store.get(id);
  if (!monitor) return { error: "Monitor not found", status: 404 };
  if (monitor.status === "down") return { error: "Monitor is already down", status: 409 };

  monitor.status = "active";
  monitor.lastHeartbeat = new Date().toISOString();
  monitor.updatedAt = monitor.lastHeartbeat;
  startTimer(monitor);

  return { monitor };
}

function pause(id) {
  const monitor = store.get(id);
  if (!monitor) return { error: "Monitor not found", status: 404 };
  if (monitor.status === "down") return { error: "Cannot pause a down monitor", status: 409 };
  if (monitor.status === "paused") return { monitor }; // idempotent

  clearTimer(monitor);
  monitor.status = "paused";
  monitor.updatedAt = new Date().toISOString();

  return { monitor };
}

function get(id) {
  const monitor = store.get(id);
  if (!monitor) return { error: "Monitor not found", status: 404 };
  return { monitor };
}

function remove(id) {
  const monitor = store.get(id);
  if (!monitor) return { error: "Monitor not found", status: 404 };

  clearTimer(monitor);
  store.delete(id);
  return { deleted: id };
}

function list() {
  return [...store.values()].map(safeView);
}

// Strip the internal timer handle before sending to client
function safeView(monitor) {
  const { timer, ...rest } = monitor;
  return rest;
}

module.exports = { create, heartbeat, pause, get, remove, list, safeView };

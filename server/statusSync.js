const db = require("./db");

const AUTO_STATUSES = ["Confirm", "Upcoming", "Ongoing", "Completed"];
const UPCOMING_WINDOW_DAYS = 3;

function computeAutoStatus(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDay = new Date(`${dateStr}T00:00:00`);
  eventDay.setHours(0, 0, 0, 0);
  const diffDays = Math.round((eventDay - today) / (1000 * 60 * 60 * 24));

  if (diffDays > UPCOMING_WINDOW_DAYS) return "Confirm";
  if (diffDays >= 1) return "Upcoming";
  if (diffDays === 0) return "Ongoing";
  return "Completed";
}

function resolveStatus(incomingStatus, dateStr) {
  if (incomingStatus === "Cancelled") return "Cancelled";
  return computeAutoStatus(dateStr);
}

function syncEventStatuses() {
  const events = db.prepare("SELECT id, name, date, status FROM events").all();
  const updateStmt = db.prepare("UPDATE events SET status = ? WHERE id = ?");
  const logStmt = db.prepare(
    "INSERT INTO status_changes (event_id, event_name, old_status, new_status) VALUES (?, ?, ?, ?)"
  );

  for (const event of events) {
    if (event.status === "Cancelled" || !AUTO_STATUSES.includes(event.status)) continue;
    const next = computeAutoStatus(event.date);
    if (next !== event.status) {
      updateStmt.run(next, event.id);
      logStmt.run(event.id, event.name, event.status, next);
    }
  }
}

module.exports = { computeAutoStatus, resolveStatus, syncEventStatuses };

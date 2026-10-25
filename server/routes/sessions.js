const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", (req, res) => {
  const { event_id } = req.query;
  if (!event_id) return res.status(400).json({ error: "event_id is required" });

  const sessions = db
    .prepare("SELECT * FROM event_sessions WHERE event_id = ? ORDER BY date ASC, time ASC")
    .all(event_id);
  res.json(sessions);
});

router.post("/", (req, res) => {
  const { event_id, name, date, time, location } = req.body;
  if (!event_id || !name || !date) {
    return res.status(400).json({ error: "event_id, name, and date are required" });
  }

  const result = db
    .prepare("INSERT INTO event_sessions (event_id, name, date, time, location) VALUES (?, ?, ?, ?, ?)")
    .run(event_id, name, date, time || null, location || null);

  res.status(201).json(db.prepare("SELECT * FROM event_sessions WHERE id = ?").get(result.lastInsertRowid));
});

router.patch("/:id", (req, res) => {
  const session = db.prepare("SELECT * FROM event_sessions WHERE id = ?").get(req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found" });

  const { name, date, time, location } = req.body;
  db.prepare("UPDATE event_sessions SET name = ?, date = ?, time = ?, location = ? WHERE id = ?").run(
    name ?? session.name,
    date ?? session.date,
    time !== undefined ? time : session.time,
    location !== undefined ? location : session.location,
    session.id
  );

  res.json(db.prepare("SELECT * FROM event_sessions WHERE id = ?").get(session.id));
});

router.delete("/:id", (req, res) => {
  const session = db.prepare("SELECT * FROM event_sessions WHERE id = ?").get(req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found" });

  db.prepare("DELETE FROM event_sessions WHERE id = ?").run(session.id);
  res.status(204).end();
});

module.exports = router;

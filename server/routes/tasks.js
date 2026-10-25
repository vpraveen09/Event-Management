const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", (req, res) => {
  const { event_id } = req.query;
  if (!event_id) return res.status(400).json({ error: "event_id is required" });

  const tasks = db
    .prepare("SELECT * FROM tasks WHERE event_id = ? ORDER BY created_at ASC")
    .all(event_id);
  res.json(tasks);
});

router.post("/", (req, res) => {
  const { event_id, title, due_date } = req.body;
  if (!event_id || !title) {
    return res.status(400).json({ error: "event_id and title are required" });
  }

  const result = db
    .prepare("INSERT INTO tasks (event_id, title, due_date) VALUES (?, ?, ?)")
    .run(event_id, title, due_date || null);

  res.status(201).json(db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid));
});

router.patch("/:id", (req, res) => {
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const { title, done, due_date } = req.body;
  db.prepare("UPDATE tasks SET title = ?, done = ?, due_date = ? WHERE id = ?").run(
    title ?? task.title,
    done !== undefined ? (done ? 1 : 0) : task.done,
    due_date !== undefined ? due_date : task.due_date,
    task.id
  );

  res.json(db.prepare("SELECT * FROM tasks WHERE id = ?").get(task.id));
});

router.delete("/:id", (req, res) => {
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  db.prepare("DELETE FROM tasks WHERE id = ?").run(task.id);
  res.status(204).end();
});

module.exports = router;

const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/", (req, res) => {
  const users = db
    .prepare("SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at ASC")
    .all();
  res.json(users);
});

router.post("/", (req, res) => {
  const { name, email, phone, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required" });
  }

  const existingEmail = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existingEmail) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const existingName = db.prepare("SELECT id FROM users WHERE name = ?").get(name);
  if (existingName) {
    return res.status(409).json({ error: "This username is already taken" });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare("INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)")
    .run(name, email, phone || null, passwordHash, role === "admin" ? "admin" : "user");

  const user = db
    .prepare("SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?")
    .get(result.lastInsertRowid);
  res.status(201).json(user);
});

router.patch("/:id", (req, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.user.id) {
    return res.status(400).json({ error: "You cannot change your own role" });
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(targetId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { role } = req.body;
  db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role === "admin" ? "admin" : "user", targetId);

  res.json(db.prepare("SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?").get(targetId));
});

router.delete("/:id", (req, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.user.id) {
    return res.status(400).json({ error: "You cannot delete your own account" });
  }

  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(targetId);
  if (!user) return res.status(404).json({ error: "User not found" });

  db.prepare("DELETE FROM users WHERE id = ?").run(targetId);
  res.status(204).end();
});

router.post("/:id/reset-password", (req, res) => {
  const targetId = Number(req.params.id);
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ error: "password must be at least 6 characters" });
  }

  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(targetId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const passwordHash = bcrypt.hashSync(password, 10);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, targetId);

  res.json({ ok: true });
});

module.exports = router;

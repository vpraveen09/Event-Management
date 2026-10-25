const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");
const { loginRateLimit } = require("../middleware/rateLimit");

const router = express.Router();

function signToken(user) {
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "7d" });
}

router.post("/register", (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "password must be at least 6 characters" });
  }

  const existingEmail = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existingEmail) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const existingName = db.prepare("SELECT id FROM users WHERE name = ?").get(name);
  if (existingName) {
    return res.status(409).json({ error: "This username is already taken" });
  }

  const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  const role = userCount === 0 ? "admin" : "user";

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare("INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)")
    .run(name, email, phone || null, passwordHash, role);

  const user = { id: result.lastInsertRowid, name, email, phone: phone || null, role };
  const token = signToken({ id: user.id, name: user.name, email: user.email, role: user.role });

  res.status(201).json({ token, user });
});

router.post("/login", loginRateLimit, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  const row = db.prepare("SELECT * FROM users WHERE name = ?").get(username);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const user = { id: row.id, name: row.name, email: row.email, phone: row.phone, role: row.role };
  const token = signToken({ id: user.id, name: user.name, email: user.email, role: user.role });

  res.json({ token, user });
});

router.post("/change-password", requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "currentPassword and newPassword are required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "newPassword must be at least 6 characters" });
  }

  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!row || !bcrypt.compareSync(currentPassword, row.password_hash)) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  const passwordHash = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, row.id);

  res.json({ ok: true });
});

module.exports = router;

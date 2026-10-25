const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", (req, res) => {
  const clients = db.prepare("SELECT * FROM clients ORDER BY created_at DESC").all();
  res.json(clients);
});

router.post("/", (req, res) => {
  const { name, email, phone, address, notes } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });

  const result = db
    .prepare("INSERT INTO clients (name, email, phone, address, notes) VALUES (?, ?, ?, ?, ?)")
    .run(name, email || null, phone || null, address || null, notes || null);

  res.status(201).json(db.prepare("SELECT * FROM clients WHERE id = ?").get(result.lastInsertRowid));
});

router.put("/:id", (req, res) => {
  const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id);
  if (!client) return res.status(404).json({ error: "Client not found" });

  const { name, email, phone, address, notes } = req.body;
  db.prepare("UPDATE clients SET name = ?, email = ?, phone = ?, address = ?, notes = ? WHERE id = ?").run(
    name ?? client.name,
    email ?? client.email,
    phone ?? client.phone,
    address ?? client.address,
    notes ?? client.notes,
    client.id
  );

  res.json(db.prepare("SELECT * FROM clients WHERE id = ?").get(client.id));
});

router.delete("/:id", (req, res) => {
  const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id);
  if (!client) return res.status(404).json({ error: "Client not found" });

  db.prepare("DELETE FROM clients WHERE id = ?").run(client.id);
  res.status(204).end();
});

module.exports = router;

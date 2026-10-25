const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", (req, res) => {
  const images = db.prepare("SELECT * FROM scenery_images ORDER BY created_at DESC").all();
  res.json(images);
});

router.post("/", (req, res) => {
  const { filename, mime_type, data, caption, theme } = req.body;
  if (!filename || !data) {
    return res.status(400).json({ error: "filename and data are required" });
  }

  const approxSize = Math.round((data.length * 3) / 4);
  const result = db
    .prepare("INSERT INTO scenery_images (filename, mime_type, size, data, caption, theme) VALUES (?, ?, ?, ?, ?, ?)")
    .run(filename, mime_type || null, approxSize, data, caption || null, theme || null);

  res.status(201).json(db.prepare("SELECT * FROM scenery_images WHERE id = ?").get(result.lastInsertRowid));
});

router.delete("/:id", (req, res) => {
  const image = db.prepare("SELECT id FROM scenery_images WHERE id = ?").get(req.params.id);
  if (!image) return res.status(404).json({ error: "Image not found" });

  db.prepare("DELETE FROM scenery_images WHERE id = ?").run(image.id);
  res.status(204).end();
});

module.exports = router;

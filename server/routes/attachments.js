const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

const VALID_TYPES = ["client", "event", "vendor"];

router.get("/", (req, res) => {
  const { entity_type, entity_id } = req.query;
  if (!VALID_TYPES.includes(entity_type) || !entity_id) {
    return res.status(400).json({ error: "valid entity_type and entity_id are required" });
  }

  const attachments = db
    .prepare(
      "SELECT id, entity_type, entity_id, filename, mime_type, size, created_at FROM attachments WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC"
    )
    .all(entity_type, entity_id);
  res.json(attachments);
});

router.post("/", (req, res) => {
  const { entity_type, entity_id, filename, mime_type, data } = req.body;
  if (!VALID_TYPES.includes(entity_type) || !entity_id || !filename || !data) {
    return res.status(400).json({ error: "entity_type, entity_id, filename and data are required" });
  }

  const approxSize = Math.round((data.length * 3) / 4);
  const result = db
    .prepare(
      "INSERT INTO attachments (entity_type, entity_id, filename, mime_type, size, data) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(entity_type, entity_id, filename, mime_type || null, approxSize, data);

  res.status(201).json(
    db
      .prepare("SELECT id, entity_type, entity_id, filename, mime_type, size, created_at FROM attachments WHERE id = ?")
      .get(result.lastInsertRowid)
  );
});

router.get("/:id/download", (req, res) => {
  const attachment = db.prepare("SELECT * FROM attachments WHERE id = ?").get(req.params.id);
  if (!attachment) return res.status(404).json({ error: "Attachment not found" });
  res.json({ filename: attachment.filename, mime_type: attachment.mime_type, data: attachment.data });
});

router.delete("/:id", (req, res) => {
  const attachment = db.prepare("SELECT id FROM attachments WHERE id = ?").get(req.params.id);
  if (!attachment) return res.status(404).json({ error: "Attachment not found" });

  db.prepare("DELETE FROM attachments WHERE id = ?").run(attachment.id);
  res.status(204).end();
});

module.exports = router;

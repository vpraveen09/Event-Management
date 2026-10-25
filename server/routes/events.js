const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");
const { resolveStatus, syncEventStatuses } = require("../statusSync");

const router = express.Router();

router.use(requireAuth);

const EVENT_SELECT = `
  SELECT events.*, clients.name AS client_name, clients.email AS client_email, clients.phone AS client_phone,
    (SELECT COUNT(*) FROM event_decoration_images WHERE event_id = events.id) AS decoration_count
  FROM events
  LEFT JOIN clients ON clients.id = events.client_id
`;

function loadEvent(id) {
  return db.prepare(`${EVENT_SELECT} WHERE events.id = ?`).get(id);
}

router.get("/", (req, res) => {
  syncEventStatuses();
  const events = db.prepare(`${EVENT_SELECT} ORDER BY events.date ASC`).all();
  res.json(events);
});

router.get("/status-changes", (req, res) => {
  const rows = db.prepare("SELECT * FROM status_changes ORDER BY id DESC LIMIT 20").all();
  res.json(rows);
});

router.get("/:id/decoration-images", (req, res) => {
  const event = db.prepare("SELECT id FROM events WHERE id = ?").get(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });

  const images = db
    .prepare(
      `SELECT si.id, si.filename, si.mime_type, si.data, si.caption, si.theme
       FROM event_decoration_images edi
       JOIN scenery_images si ON si.id = edi.scenery_image_id
       WHERE edi.event_id = ?
       ORDER BY edi.created_at ASC`
    )
    .all(event.id);
  res.json(images);
});

router.post("/:id/decoration-images", (req, res) => {
  const event = db.prepare("SELECT id FROM events WHERE id = ?").get(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });

  const { scenery_image_id } = req.body;
  if (!scenery_image_id) return res.status(400).json({ error: "scenery_image_id is required" });

  db.prepare(
    "INSERT OR IGNORE INTO event_decoration_images (event_id, scenery_image_id) VALUES (?, ?)"
  ).run(event.id, scenery_image_id);
  res.status(201).json({ ok: true });
});

router.delete("/:id/decoration-images/:sceneryImageId", (req, res) => {
  db.prepare("DELETE FROM event_decoration_images WHERE event_id = ? AND scenery_image_id = ?").run(
    req.params.id,
    req.params.sceneryImageId
  );
  res.status(204).end();
});

router.post("/", (req, res) => {
  const {
    name,
    date,
    time,
    location,
    client_id,
    guest_count,
    event_type,
    status,
    paid,
    budget,
    advance,
    received_amount,
    description,
  } = req.body;

  if (!name || !date) {
    return res.status(400).json({ error: "name and date are required" });
  }

  const result = db
    .prepare(
      `INSERT INTO events
        (name, date, time, location, client_id, guest_count, event_type, status, paid, budget, advance, received_amount, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      name,
      date,
      time || null,
      location || null,
      client_id || null,
      guest_count != null ? Number(guest_count) : null,
      event_type || null,
      resolveStatus(status, date),
      paid ? 1 : 0,
      budget != null ? Number(budget) : null,
      advance != null ? Number(advance) : null,
      received_amount != null ? Number(received_amount) : null,
      description || null
    );

  res.status(201).json(loadEvent(result.lastInsertRowid));
});

router.put("/:id", (req, res) => {
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });

  const {
    name,
    date,
    time,
    location,
    client_id,
    guest_count,
    event_type,
    status,
    paid,
    budget,
    advance,
    received_amount,
    description,
  } = req.body;

  db.prepare(
    `UPDATE events SET
      name = ?, date = ?, time = ?, location = ?, client_id = ?, guest_count = ?,
      event_type = ?, status = ?, paid = ?, budget = ?, advance = ?, received_amount = ?, description = ?
     WHERE id = ?`
  ).run(
    name ?? event.name,
    date ?? event.date,
    time ?? event.time,
    location ?? event.location,
    client_id !== undefined ? client_id : event.client_id,
    guest_count != null ? Number(guest_count) : event.guest_count,
    event_type ?? event.event_type,
    resolveStatus(status ?? event.status, date ?? event.date),
    paid !== undefined ? (paid ? 1 : 0) : event.paid,
    budget != null ? Number(budget) : event.budget,
    advance != null ? Number(advance) : event.advance,
    received_amount != null ? Number(received_amount) : event.received_amount,
    description ?? event.description,
    event.id
  );

  res.json(loadEvent(event.id));
});

router.delete("/:id", (req, res) => {
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });

  db.prepare("DELETE FROM events WHERE id = ?").run(event.id);
  res.status(204).end();
});

module.exports = router;

const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

function loadVendor(id) {
  return db
    .prepare(
      `SELECT vendors.*, events.name AS event_name
       FROM vendors LEFT JOIN events ON events.id = vendors.event_id
       WHERE vendors.id = ?`
    )
    .get(id);
}

router.get("/", (req, res) => {
  const vendors = db
    .prepare(
      `SELECT vendors.*, events.name AS event_name
       FROM vendors LEFT JOIN events ON events.id = vendors.event_id
       ORDER BY vendors.created_at DESC`
    )
    .all();
  res.json(vendors);
});

router.post("/", (req, res) => {
  const { name, phone, email, vendor_type, event_id, total_amount, advance_paid, paid, notes } = req.body;

  if (!name) return res.status(400).json({ error: "name is required" });

  const result = db
    .prepare(
      `INSERT INTO vendors (name, phone, email, vendor_type, event_id, total_amount, advance_paid, paid, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      name,
      phone || null,
      email || null,
      vendor_type || null,
      event_id || null,
      total_amount != null ? Number(total_amount) : 0,
      advance_paid != null ? Number(advance_paid) : 0,
      paid ? 1 : 0,
      notes || null
    );

  res.status(201).json(loadVendor(result.lastInsertRowid));
});

router.put("/:id", (req, res) => {
  const vendor = db.prepare("SELECT * FROM vendors WHERE id = ?").get(req.params.id);
  if (!vendor) return res.status(404).json({ error: "Vendor not found" });

  const { name, phone, email, vendor_type, event_id, total_amount, advance_paid, paid, notes } = req.body;

  db.prepare(
    `UPDATE vendors SET
      name = ?, phone = ?, email = ?, vendor_type = ?, event_id = ?, total_amount = ?, advance_paid = ?, paid = ?, notes = ?
     WHERE id = ?`
  ).run(
    name ?? vendor.name,
    phone ?? vendor.phone,
    email ?? vendor.email,
    vendor_type ?? vendor.vendor_type,
    event_id !== undefined ? event_id : vendor.event_id,
    total_amount != null ? Number(total_amount) : vendor.total_amount,
    advance_paid != null ? Number(advance_paid) : vendor.advance_paid,
    paid !== undefined ? (paid ? 1 : 0) : vendor.paid,
    notes ?? vendor.notes,
    vendor.id
  );

  res.json(loadVendor(vendor.id));
});

router.delete("/:id", (req, res) => {
  const vendor = db.prepare("SELECT * FROM vendors WHERE id = ?").get(req.params.id);
  if (!vendor) return res.status(404).json({ error: "Vendor not found" });

  db.prepare("DELETE FROM vendors WHERE id = ?").run(vendor.id);
  res.status(204).end();
});

module.exports = router;

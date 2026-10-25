const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

function toCsv(rows, columns) {
  const escape = (value) => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };

  const header = columns.map((c) => c.label).join(",");
  const body = rows.map((row) => columns.map((c) => escape(row[c.key])).join(",")).join("\n");
  return `${header}\n${body}`;
}

function sendCsv(res, filename, csv) {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
}

router.get("/clients.csv", (req, res) => {
  const clients = db.prepare("SELECT * FROM clients ORDER BY created_at DESC").all();
  const csv = toCsv(clients, [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "address", label: "Address" },
    { key: "notes", label: "Notes" },
    { key: "created_at", label: "Created At" },
  ]);
  sendCsv(res, "clients.csv", csv);
});

router.get("/events.csv", (req, res) => {
  const events = db
    .prepare(
      `SELECT events.*, clients.name AS client_name
       FROM events LEFT JOIN clients ON clients.id = events.client_id
       ORDER BY events.date ASC`
    )
    .all();
  const csv = toCsv(events, [
    { key: "name", label: "Event" },
    { key: "event_type", label: "Type" },
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "location", label: "Location" },
    { key: "client_name", label: "Client" },
    { key: "guest_count", label: "Guest Count" },
    { key: "status", label: "Status" },
    { key: "budget", label: "Budget" },
    { key: "advance", label: "Advance" },
    { key: "received_amount", label: "Received Amount" },
  ]);
  sendCsv(res, "events.csv", csv);
});

router.get("/vendors.csv", (req, res) => {
  const vendors = db
    .prepare(
      `SELECT vendors.*, events.name AS event_name
       FROM vendors LEFT JOIN events ON events.id = vendors.event_id
       ORDER BY vendors.created_at DESC`
    )
    .all();
  const csv = toCsv(vendors, [
    { key: "name", label: "Vendor" },
    { key: "vendor_type", label: "Type" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "event_name", label: "Linked Event" },
    { key: "total_amount", label: "Total Amount" },
    { key: "advance_paid", label: "Advance Paid" },
  ]);
  sendCsv(res, "vendors.csv", csv);
});

function toIcsDate(date, time) {
  const d = new Date(`${date}T${time || "00:00"}`);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function icsEscape(text) {
  return String(text || "").replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
}

router.get("/events.ics", (req, res) => {
  const events = db
    .prepare(
      `SELECT events.*, clients.name AS client_name
       FROM events LEFT JOIN clients ON clients.id = events.client_id`
    )
    .all();

  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Event Manager//EN"];

  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:event-${e.id}@event-manager`,
      `DTSTAMP:${toIcsDate(e.date, e.time)}Z`,
      `DTSTART:${toIcsDate(e.date, e.time)}`,
      `SUMMARY:${icsEscape(e.name)}`,
      `LOCATION:${icsEscape(e.location)}`,
      `DESCRIPTION:${icsEscape(
        [e.event_type, e.client_name ? `Client: ${e.client_name}` : "", e.description].filter(Boolean).join(" | ")
      )}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  res.setHeader("Content-Type", "text/calendar");
  res.setHeader("Content-Disposition", 'attachment; filename="events.ics"');
  res.send(lines.join("\r\n"));
});

module.exports = router;

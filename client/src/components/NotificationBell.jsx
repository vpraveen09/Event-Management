import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CalendarClock, Wallet, RefreshCcw } from "lucide-react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { formatCurrency } from "../format.js";

const SEEN_KEY = "em_notified_ids";
const POLL_MS = 5 * 60 * 1000;
const UPCOMING_WINDOW_DAYS = 3;
const PAYMENT_WINDOW_DAYS = 7;
const STATUS_LOG_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

function loadSeen() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function saveSeen(set) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...set]));
  } catch {
    // ignore storage failures (private browsing, quota, etc.)
  }
}

export default function NotificationBell() {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [statusChanges, setStatusChanges] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const seenRef = useRef(loadSeen());

  useEffect(() => {
    function load() {
      api
        .listEvents(token)
        .then(setEvents)
        .catch(() => {});
      api
        .listVendors(token)
        .then(setVendors)
        .catch(() => {});
      api
        .listStatusChanges(token)
        .then(setStatusChanges)
        .catch(() => {});
    }
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const notifications = useMemo(() => {
    const now = new Date();
    const items = [];

    for (const e of events) {
      if (e.status === "Cancelled" || e.status === "Completed") continue;
      const eventDate = new Date(`${e.date}T${e.time || "00:00"}`);
      const daysUntil = (eventDate - now) / (1000 * 60 * 60 * 24);

      if (daysUntil >= 0 && daysUntil <= UPCOMING_WINDOW_DAYS) {
        items.push({
          id: `upcoming-${e.id}`,
          type: "upcoming",
          title: `${e.name} is coming up`,
          detail: daysUntil < 1 ? "Today" : `In ${Math.ceil(daysUntil)} day(s)`,
        });
      }

      const balance = (Number(e.budget) || 0) - (Number(e.received_amount) || 0);
      if (balance > 0 && daysUntil <= PAYMENT_WINDOW_DAYS) {
        items.push({
          id: `payment-${e.id}`,
          type: "payment",
          title: `${e.name} has a balance due`,
          detail: `${formatCurrency(balance)} outstanding`,
        });
      }
    }

    const eventById = new Map(events.map((e) => [e.id, e]));
    for (const v of vendors) {
      const balance = (Number(v.total_amount) || 0) - (Number(v.advance_paid) || 0);
      if (balance <= 0) continue;

      const linkedEvent = v.event_id ? eventById.get(v.event_id) : null;
      if (linkedEvent) {
        if (linkedEvent.status === "Cancelled") continue;
        const eventDate = new Date(`${linkedEvent.date}T${linkedEvent.time || "00:00"}`);
        const daysUntil = (eventDate - now) / (1000 * 60 * 60 * 24);
        if (daysUntil > PAYMENT_WINDOW_DAYS) continue;
      }

      items.push({
        id: `vendor-payment-${v.id}`,
        type: "vendor-payment",
        title: `${v.name} has a vendor balance due`,
        detail: `${formatCurrency(balance)} payable${linkedEvent ? ` • ${linkedEvent.name}` : ""}`,
      });
    }

    for (const s of statusChanges) {
      const changedAt = new Date(`${s.created_at}Z`);
      if (now - changedAt > STATUS_LOG_WINDOW_MS) continue;
      items.push({
        id: `status-${s.id}`,
        type: "status",
        title: `${s.event_name} is now ${s.new_status}`,
        detail: `Changed from ${s.old_status} • ${changedAt.toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })}`,
      });
    }

    return items;
  }, [events, vendors, statusChanges]);

  useEffect(() => {
    const newOnes = notifications.filter((n) => !seenRef.current.has(n.id));
    if (newOnes.length === 0 || !("Notification" in window)) return;

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
    if (Notification.permission === "granted") {
      newOnes.forEach((n) => {
        new Notification(n.title, { body: n.detail, tag: n.id });
        seenRef.current.add(n.id);
      });
      saveSeen(seenRef.current);
    }
  }, [notifications]);

  return (
    <div className="notification-bell" ref={containerRef}>
      <button
        type="button"
        className="icon-button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell size={15} />
        {notifications.length > 0 && <span className="notification-dot">{notifications.length}</span>}
      </button>

      {open && (
        <div className="notification-dropdown">
          <p className="notification-dropdown-title">Notifications</p>
          {notifications.length === 0 ? (
            <p className="event-meta notification-empty">You're all caught up.</p>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li key={n.id}>
                  <Link to={n.type === "vendor-payment" ? "/vendors" : "/events"} onClick={() => setOpen(false)}>
                    {n.type === "upcoming" ? (
                      <CalendarClock size={14} />
                    ) : n.type === "status" ? (
                      <RefreshCcw size={14} />
                    ) : (
                      <Wallet size={14} />
                    )}
                    <span className="notification-text">
                      <span>{n.title}</span>
                      <span className="event-meta">{n.detail}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

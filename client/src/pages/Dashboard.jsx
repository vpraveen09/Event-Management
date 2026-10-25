import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Image, Users, CalendarClock, CalendarCheck, Wallet, CalendarRange, Mail, Phone, TrendingUp } from "lucide-react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { useSettings } from "../settings.jsx";
import { formatCurrency } from "../format.js";
import Calendar from "../components/Calendar.jsx";

function initials(name) {
  return (name || "")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function monthKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function monthLabel(d) {
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function buildMonthlyCounts(events) {
  if (events.length === 0) return [];
  const dates = events.map((e) => new Date(e.date));
  const start = new Date(Math.min(...dates));
  const end = new Date(Math.max(...dates));
  const counts = new Map();
  events.forEach((e) => {
    const key = monthKey(new Date(e.date));
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const result = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    const key = monthKey(cursor);
    result.push({ key, label: monthLabel(cursor), count: counts.get(key) || 0 });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return result;
}

function MonthlyChart({ data }) {
  if (data.length === 0) {
    return <p className="event-meta">No event data yet.</p>;
  }

  const max = Math.max(1, ...data.map((d) => d.count));
  const barWidth = 36;
  const gap = 28;
  const height = 140;
  const width = data.length * (barWidth + gap) + gap;

  return (
    <svg width="100%" height={height + 50} viewBox={`0 0 ${width} ${height + 50}`} preserveAspectRatio="xMinYMin meet">
      <line x1="0" y1={height} x2={width} y2={height} stroke="var(--border)" strokeWidth="1" />
      {data.map((d, i) => {
        const barHeight = (d.count / max) * (height - 10);
        const x = i * (barWidth + gap) + gap;
        return (
          <g key={d.key}>
            <rect
              x={x}
              y={height - barHeight}
              width={barWidth}
              height={barHeight}
              rx="4"
              style={{ fill: "var(--accent)" }}
            />
            <text
              x={x + barWidth / 2}
              y={height + 16}
              fontSize="10"
              textAnchor="end"
              transform={`rotate(-40 ${x + barWidth / 2} ${height + 16})`}
              style={{ fill: "var(--muted)" }}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const RANGE_TABS = [
  { key: "booked", label: "Booked" },
  { key: "3m", label: "3M" },
  { key: "6m", label: "6M" },
  { key: "all", label: "All" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { logo } = useSettings();
  const [clients, setClients] = useState([]);
  const [events, setEvents] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [error, setError] = useState("");
  const [calendarView, setCalendarView] = useState(false);
  const [range, setRange] = useState("booked");

  useEffect(() => {
    Promise.all([api.listClients(token), api.listEvents(token), api.listVendors(token)])
      .then(([clientData, eventData, vendorData]) => {
        setClients(clientData);
        setEvents(eventData);
        setVendors(vendorData);
      })
      .catch((err) => setError(err.message));
  }, [token]);

  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = events.filter((e) => new Date(e.date) >= now).length;
    const totalAmount = events.reduce((sum, e) => sum + (Number(e.budget) || 0), 0);
    const totalVendorCost = vendors.reduce((sum, v) => sum + (Number(v.total_amount) || 0), 0);
    return {
      totalClients: clients.length,
      totalEvents: events.length,
      upcoming,
      totalAmount,
      totalProfit: totalAmount - totalVendorCost,
    };
  }, [clients, events, vendors]);

  const recentClients = useMemo(() => clients.slice(0, 3), [clients]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3);
  }, [events]);

  const calendarEvents = useMemo(
    () => events.map((e) => ({ ...e, title: e.name, start_time: `${e.date}T${e.time || "00:00"}` })),
    [events]
  );

  const chartData = useMemo(() => {
    const now = new Date();
    let filtered = events;
    if (range === "3m") {
      const cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      filtered = events.filter((e) => new Date(e.date) >= cutoff);
    } else if (range === "6m") {
      const cutoff = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      filtered = events.filter((e) => new Date(e.date) >= cutoff);
    }
    return buildMonthlyCounts(filtered);
  }, [events, range]);

  return (
    <section>
      <div className="page-header">
        <div className="dashboard-title">
          {logo ? (
            <img src={logo} alt="Logo" className="dashboard-logo" />
          ) : (
            <CalendarRange size={28} className="dashboard-icon" />
          )}
          <div>
            <h1>Dashboard</h1>
            <p className="event-meta">Overview of your clients and events</p>
          </div>
        </div>
        <div className="header-actions no-print">
          <button type="button" className="secondary-button" onClick={() => navigate("/scenery")}>
            <Image size={16} /> Scenery
          </button>
          <label className="toggle-row">
            <span>Calendar View</span>
            <span
              className={`toggle-switch ${calendarView ? "toggle-switch-on" : ""}`}
              onClick={() => setCalendarView((v) => !v)}
            >
              <span className="toggle-knob" />
            </span>
          </label>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="stats-row">
        <div className="stat-card">
          <Users size={20} />
          <div>
            <span className="stat-value">{stats.totalClients}</span>
            {/* <span className="stat-label">Active client records</span> */}
            <span className="stat-title">Total Clients</span>
          </div>
        </div>
        <div className="stat-card">
          <CalendarClock size={20} />
          <div>
            <span className="stat-value">{stats.totalEvents}</span>
            {/* <span className="stat-label">All events managed</span> */}
            <span className="stat-title">Total Events</span>
          </div>
        </div>
        <div className="stat-card">
          <CalendarCheck size={20} />
          <div>
            <span className="stat-value">
              {stats.upcoming} / {stats.totalEvents}
            </span>
            <span className="stat-title">Upcoming / Total events</span>
            {/* <span className="stat-title">Upcoming Events</span> */}
          </div>
        </div>
        <div className="stat-card">
          <Wallet size={20} />
          <div>
            <span className="stat-value">{formatCurrency(stats.totalAmount)}</span>
            {/* <span className="stat-label">Total event budgets</span> */}
            <span className="stat-title">Total Amount</span>
          </div>
        </div>
        <div className="stat-card">
          <TrendingUp size={20} />
          <div>
            <span className={`stat-value ${stats.totalProfit >= 0 ? "profit-positive" : "profit-negative"}`}>
              {formatCurrency(stats.totalProfit)}
            </span>
            <span className="stat-title">Total Profit</span>
          </div>
        </div>
      </div>

      {calendarView ? (
        <Calendar events={calendarEvents} />
      ) : (
        <>
          <div className="dashboard-grid">
            <div className="card">
              <div className="card-heading card-heading-row">
                <h3>Recent Clients</h3>
                <Link to="/clients">View All →</Link>
              </div>
              {recentClients.length === 0 ? (
                <p className="event-meta">No clients yet.</p>
              ) : (
                recentClients.map((client) => (
                  <div key={client.id} className="mini-list-item">
                    <span className="avatar-circle">{initials(client.name)}</span>
                    <div>
                      <strong>{client.name}</strong>
                      {client.email && (
                        <div className="event-meta">
                          <Mail size={12} /> {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div className="event-meta">
                          <Phone size={12} /> {client.phone}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <div className="card-heading card-heading-row">
                <h3>Upcoming Events</h3>
                <Link to="/events">View All →</Link>
              </div>
              {upcomingEvents.length === 0 ? (
                <div className="empty-state">
                  <CalendarClock size={28} />
                  <p>No upcoming events</p>
                  <Link to="/events">Schedule your first event</Link>
                </div>
              ) : (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="mini-list-item">
                    <span className="avatar-circle avatar-circle-accent">
                      <CalendarClock size={16} />
                    </span>
                    <div>
                      <strong>{event.name}</strong>
                      <div className="event-meta">
                        {new Date(event.date).toLocaleDateString(undefined, { dateStyle: "medium" })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card chart-card">
            <div className="card-heading card-heading-row">
              <div>
                <h3>Monthly Events Overview</h3>
                <p className="event-meta">Event count over time</p>
              </div>
              <div className="chart-tabs no-print">
                {RANGE_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={range === tab.key ? "chart-tab chart-tab-active" : "chart-tab"}
                    onClick={() => setRange(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <MonthlyChart data={chartData} />
          </div>
        </>
      )}
    </section>
  );
}

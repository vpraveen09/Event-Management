import { useEffect, useState } from "react";
import { Plus, Trash2, CalendarClock, MapPin } from "lucide-react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import Modal from "./Modal.jsx";
import TimePicker from "./TimePicker.jsx";
import { formatTime12h } from "../format.js";

const EMPTY_FORM = { name: "", date: "", time: "", location: "" };

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString(undefined, { dateStyle: "medium" });
}

export default function SessionsModal({ event, onClose }) {
  const { token } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  function load() {
    api
      .listSessions(event.id, token)
      .then(setSessions)
      .catch((err) => setError(err.message));
  }

  useEffect(load, [event.id, token]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.date) return;
    try {
      await api.createSession({ event_id: event.id, ...form, name: form.name.trim() }, token);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteSession(id, token);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal
      title={`Functions / Sessions — ${event.name}`}
      subtitle="Add separate dates or functions under this event, e.g. Mehendi, Sangeet, Reception"
      onClose={onClose}
      size="wide"
    >
      <form onSubmit={handleAdd}>
        <div className="form-row form-row-3">
          <label>
            Function Name
            <input
              placeholder="e.g. Mehendi"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Date
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </label>
          <label>
            Time
            <TimePicker value={form.time} onChange={(time) => setForm({ ...form, time })} />
          </label>
        </div>
        <label>
          Location
          <input
            placeholder="Optional"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </label>
        <button type="submit" className="secondary-button" style={{ marginTop: "0.4rem" }}>
          <Plus size={16} /> Add Function
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {sessions.length === 0 ? (
        <p className="event-meta" style={{ marginTop: "0.8rem" }}>
          No additional functions yet. The main event date above covers a single-day event by default.
        </p>
      ) : (
        <ul className="attachment-list" style={{ marginTop: "0.8rem" }}>
          {sessions.map((s) => (
            <li key={s.id}>
              <CalendarClock size={16} />
              <div className="attachment-info">
                <span>{s.name}</span>
                <span className="event-meta">
                  {formatDate(s.date)}
                  {s.time ? ` • ${formatTime12h(s.time)}` : ""}
                  {s.location ? (
                    <>
                      {" "}
                      • <MapPin size={11} style={{ verticalAlign: "-1px" }} /> {s.location}
                    </>
                  ) : (
                    ""
                  )}
                </span>
              </div>
              <button
                type="button"
                className="icon-button icon-button-danger"
                title="Delete"
                onClick={() => handleDelete(s.id)}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, Printer, Pencil, Trash2, MapPin, CalendarClock, CalendarRange, ListChecks, Paperclip, Image as ImageIcon, Search, Truck } from "lucide-react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { useSelection } from "../useSelection.js";
import Modal from "../components/Modal.jsx";
import TimePicker from "../components/TimePicker.jsx";
import NumberInput from "../components/NumberInput.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import TaskListModal from "../components/TaskListModal.jsx";
import AttachmentsModal from "../components/AttachmentsModal.jsx";
import SessionsModal from "../components/SessionsModal.jsx";
import EventVendorsModal from "../components/EventVendorsModal.jsx";
import EventDecorationModal from "../components/EventDecorationModal.jsx";
import { daysFromNow, formatCurrency } from "../format.js";

const EVENT_TYPES = ["Wedding", "Birthday", "Corporate", "Conference", "Anniversary", "Other"];
const STATUSES = ["Confirm", "Upcoming", "Ongoing", "Completed", "Cancelled"];

const EMPTY_FORM = {
  name: "",
  date: "",
  time: "",
  location: "",
  client_id: "",
  guest_count: "",
  event_type: "",
  status: "Confirm",
  paid: false,
  budget: "",
  advance: "",
  received_amount: "",
  description: "",
};

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString(undefined, { dateStyle: "medium" });
}

export default function Events() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmState, setConfirmState] = useState(null);
  const [search, setSearch] = useState("");
  const [taskEvent, setTaskEvent] = useState(null);
  const [attachmentEvent, setAttachmentEvent] = useState(null);
  const [sessionsEvent, setSessionsEvent] = useState(null);
  const [vendorsEvent, setVendorsEvent] = useState(null);
  const [decorationEvent, setDecorationEvent] = useState(null);
  const selection = useSelection(events);

  function load() {
    Promise.all([api.listEvents(token), api.listClients(token), api.listVendors(token)])
      .then(([eventData, clientData, vendorData]) => {
        setEvents(eventData);
        setClients(clientData);
        setVendors(vendorData);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(load, [token]);

  useEffect(() => {
    const showDecorationFor = location.state?.showDecorationFor;
    if (!showDecorationFor || events.length === 0) return;
    const event = events.find((e) => e.id === showDecorationFor);
    if (event) setDecorationEvent(event);
    navigate(location.pathname, { replace: true, state: {} });
  }, [events, location.state]);

  const vendorCostByEvent = useMemo(() => {
    const map = new Map();
    for (const v of vendors) {
      if (!v.event_id) continue;
      map.set(v.event_id, (map.get(v.event_id) || 0) + (Number(v.total_amount) || 0));
    }
    return map;
  }, [vendors]);

  const filteredEvents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return events;
    return events.filter((e) =>
      [e.name, e.location, e.client_name, e.event_type, e.status].some((v) => (v || "").toLowerCase().includes(term))
    );
  }, [events, search]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setModal({ mode: "add" });
  }

  function openEdit(event) {
    setForm({
      name: event.name,
      date: event.date,
      time: event.time || "",
      location: event.location || "",
      client_id: event.client_id || "",
      guest_count: event.guest_count ?? "",
      event_type: event.event_type || "",
      status: event.status || "Confirm",
      paid: Boolean(event.paid),
      budget: event.budget ?? "",
      advance: event.advance ?? "",
      received_amount: event.received_amount ?? "",
      description: event.description || "",
    });
    setModal({ mode: "edit", event });
  }

  function closeModal() {
    setModal(null);
    setError("");
  }

  function togglePaid() {
    setForm((prev) => {
      const nextPaid = !prev.paid;
      return {
        ...prev,
        paid: nextPaid,
        received_amount: nextPaid ? (prev.budget !== "" ? prev.budget : prev.received_amount) : "",
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      client_id: form.client_id || null,
      guest_count: form.guest_count === "" ? null : Number(form.guest_count),
      budget: form.budget === "" ? null : Number(form.budget),
      advance: form.advance === "" ? null : Number(form.advance),
      received_amount: form.received_amount === "" ? null : Number(form.received_amount),
    };
    try {
      if (modal.mode === "edit") {
        await api.updateEvent(modal.event.id, payload, token);
      } else {
        await api.createEvent(payload, token);
      }
      closeModal();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleDelete(id) {
    setConfirmState({
      message: "Delete this event? This cannot be undone.",
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await api.deleteEvent(id, token);
          load();
        } catch (err) {
          setError(err.message);
        }
      },
    });
  }

  function handleBulkDelete() {
    setConfirmState({
      message: `Delete ${selection.selected.size} selected event(s)? This cannot be undone.`,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await Promise.all([...selection.selected].map((id) => api.deleteEvent(id, token)));
          selection.clear();
          load();
        } catch (err) {
          setError(err.message);
        }
      },
    });
  }

  function openGalleryPicker(event) {
    navigate("/scenery", { state: { eventId: event.id, eventName: event.name } });
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Events</h1>
          <p className="event-meta">Manage your event schedule</p>
        </div>
        <div className="header-actions">
          <button type="button" className="secondary-button" onClick={() => window.print()}>
            <Printer size={16} /> Print
          </button>
          <button type="button" className="button" onClick={openAdd}>
            <Plus size={16} /> Add Event
          </button>
        </div>
      </div>

      <div className="print-title">
        <h1>All Events</h1>
      </div>

      {error && <p className="error">{error}</p>}

      {selection.someSelected && (
        <div className="bulk-bar no-print">
          <span>{selection.selected.size} selected</span>
          <button type="button" className="link-button" onClick={selection.clear}>
            Clear
          </button>
          <button type="button" className="danger-button" onClick={handleBulkDelete}>
            <Trash2 size={14} /> Delete selected
          </button>
        </div>
      )}

      <div className="card">
        <div className="card-heading">
          <h3>All Events</h3>
          <p className="event-meta">A list of all your scheduled events</p>
        </div>

        <div className="search-bar no-print">
          <Search size={15} />
          <input
            placeholder="Search by name, location, client, type, or status…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {events.length === 0 ? (
          <p>No events yet.</p>
        ) : filteredEvents.length === 0 ? (
          <p className="event-meta">No events match your search.</p>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th className="no-print checkbox-col">
                    <input type="checkbox" checked={selection.allSelected} onChange={selection.toggleAll} />
                  </th>
                  <th>Event</th>
                  <th>Type</th>
                  <th>Date &amp; Time</th>
                  <th>Days Left</th>
                  <th>Location</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Profit</th>
                  <th className="no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.id}>
                    <td className="no-print checkbox-col">
                      <input
                        type="checkbox"
                        checked={selection.selected.has(event.id)}
                        onChange={() => selection.toggle(event.id)}
                      />
                    </td>
                    <td>
                      <strong>{event.name}</strong>
                    </td>
                    <td>
                      <span className={`badge badge-type-${(event.event_type || "other").toLowerCase()}`}>
                        {event.event_type || "—"}
                      </span>
                    </td>
                    <td>
                      <div>
                        <CalendarClock size={12} style={{ verticalAlign: "-1px" }} /> {formatDate(event.date)}
                      </div>
                      <div className="event-meta">{event.time || "—"}</div>
                    </td>
                    <td>
                      <span className="badge badge-days">{daysFromNow(event.date)}</span>
                    </td>
                    <td>
                      {event.location ? (
                        <>
                          <MapPin size={12} style={{ verticalAlign: "-1px" }} /> {event.location}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{event.client_name || "—"}</td>
                    <td>
                      <span className={`badge badge-status-${event.status?.toLowerCase()}`}>{event.status}</span>
                    </td>
                    <td>
                      {(() => {
                        const cost = vendorCostByEvent.get(event.id) || 0;
                        const profit = (Number(event.budget) || 0) - cost;
                        return (
                          <span className={profit >= 0 ? "profit-positive" : "profit-negative"}>
                            {formatCurrency(profit)}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="no-print">
                      <div className="action-icons">
                        <button type="button" className="icon-button" title="Tasks" onClick={() => setTaskEvent(event)}>
                          <ListChecks size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          title="Functions / Sessions"
                          onClick={() => setSessionsEvent(event)}
                        >
                          <CalendarRange size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          title="Vendors"
                          onClick={() => setVendorsEvent(event)}
                        >
                          <Truck size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          title="Attachments"
                          onClick={() => setAttachmentEvent(event)}
                        >
                          <Paperclip size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          title="Decoration Gallery"
                          onClick={() => setDecorationEvent(event)}
                        >
                          {event.decoration_count > 0 ? (
                            <span className="event-decoration-count-only">{event.decoration_count}</span>
                          ) : (
                            <ImageIcon size={15} />
                          )}
                        </button>
                        <button type="button" className="icon-button" title="Edit" onClick={() => openEdit(event)}>
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-button icon-button-danger"
                          title="Delete"
                          onClick={() => handleDelete(event.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(modal?.mode === "add" || modal?.mode === "edit") && (
        <Modal
          title={modal.mode === "add" ? "Add New Event" : "Edit Event"}
          subtitle={modal.mode === "add" ? "Enter event details to create a new record" : "Update event information"}
          onClose={closeModal}
          size="wide"
        >
          <form onSubmit={handleSubmit}>
            <div className="form-row form-row-name-date">
              <label>
                Event Name *
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label>
                Date *
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </label>
              <label>
                Time
                <TimePicker value={form.time} onChange={(time) => setForm({ ...form, time })} />
              </label>
            </div>
            <div className="form-row">
              <label>
                Location
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </label>
              <label>
                Client
                <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
                  <option value="">Select a client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-row">
              <label>
                Guest Count
                <input
                  type="number"
                  min="0"
                  value={form.guest_count}
                  onChange={(e) => setForm({ ...form, guest_count: e.target.value })}
                />
              </label>
              <label>
                Event Type
                <select
                  value={form.event_type}
                  onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                >
                  <option value="">Select event type</option>
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-row form-row-status-paid">
              <label>
                Status
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <span className="event-meta">Updates automatically based on the event date, unless set to Cancelled.</span>
              </label>
              <label className="toggle-row">
                <span>Paid</span>
                <span
                  className={`toggle-switch ${form.paid ? "toggle-switch-on" : ""}`}
                  onClick={togglePaid}
                >
                  <span className="toggle-knob" />
                </span>
              </label>
            </div>

            <div className="form-row form-row-3">
              <label>
                Budget (₹)
                <NumberInput value={form.budget} onChange={(v) => setForm({ ...form, budget: v })} />
              </label>
              <label>
                Advance (₹)
                <NumberInput value={form.advance} onChange={(v) => setForm({ ...form, advance: v })} />
              </label>
              <label>
                Received Amount (₹)
                <NumberInput
                  value={form.received_amount}
                  onChange={(v) => setForm({ ...form, received_amount: v })}
                />
              </label>
            </div>
            <label>
              Description
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>

            {error && <p className="error">{error}</p>}
            <div className="modal-footer">
              <button type="button" className="secondary-button" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit">{modal.mode === "add" ? "Create" : "Update"}</button>
            </div>
          </form>
        </Modal>
      )}

      {confirmState && (
        <ConfirmDialog
          title="Delete event"
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}

      {taskEvent && <TaskListModal event={taskEvent} onClose={() => setTaskEvent(null)} />}

      {sessionsEvent && <SessionsModal event={sessionsEvent} onClose={() => setSessionsEvent(null)} />}

      {vendorsEvent && (
        <EventVendorsModal
          event={vendorsEvent}
          vendors={vendors.filter((v) => v.event_id === vendorsEvent.id)}
          onClose={() => setVendorsEvent(null)}
        />
      )}

      {decorationEvent && (
        <EventDecorationModal
          event={decorationEvent}
          onClose={() => setDecorationEvent(null)}
          onChooseFromGallery={() => openGalleryPicker(decorationEvent)}
        />
      )}

      {attachmentEvent && (
        <AttachmentsModal
          entityType="event"
          entityId={attachmentEvent.id}
          title={`Attachments — ${attachmentEvent.name}`}
          onClose={() => setAttachmentEvent(null)}
        />
      )}
    </section>
  );
}

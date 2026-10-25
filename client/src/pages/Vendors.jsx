import { useEffect, useMemo, useState } from "react";
import { Plus, Printer, Pencil, Trash2, Paperclip, Search } from "lucide-react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { useSettings } from "../settings.jsx";
import { useSelection } from "../useSelection.js";
import { formatCurrency } from "../format.js";
import Modal from "../components/Modal.jsx";
import VendorReportModal from "../components/VendorReportModal.jsx";
import NumberInput from "../components/NumberInput.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import AttachmentsModal from "../components/AttachmentsModal.jsx";

const VENDOR_TYPES = ["Catering", "Decoration", "Photography", "Videography", "Music/DJ", "Venue", "Transportation", "Other"];

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  vendor_type: "",
  event_id: "",
  total_amount: "",
  advance_paid: "",
  paid: false,
  notes: "",
};

function progressClass(percent) {
  if (percent >= 100) return "progress-green";
  if (percent > 0) return "progress-yellow";
  return "progress-red";
}

export default function Vendors() {
  const { token } = useAuth();
  const { logo } = useSettings();
  const [vendors, setVendors] = useState([]);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [reportVendor, setReportVendor] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmState, setConfirmState] = useState(null);
  const [search, setSearch] = useState("");
  const [attachmentVendor, setAttachmentVendor] = useState(null);
  const selection = useSelection(vendors);

  function load() {
    Promise.all([api.listVendors(token), api.listEvents(token)])
      .then(([vendorData, eventData]) => {
        setVendors(vendorData);
        setEvents(eventData);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(load, [token]);

  const filteredVendors = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return vendors;
    return vendors.filter((v) =>
      [v.name, v.phone, v.vendor_type, v.event_name].some((f) => (f || "").toLowerCase().includes(term))
    );
  }, [vendors, search]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setModal({ mode: "add" });
  }

  function openEdit(vendor) {
    setForm({
      name: vendor.name,
      phone: vendor.phone || "",
      email: vendor.email || "",
      vendor_type: vendor.vendor_type || "",
      event_id: vendor.event_id || "",
      total_amount: vendor.total_amount ?? "",
      advance_paid: vendor.advance_paid ?? "",
      paid: Boolean(vendor.paid),
      notes: vendor.notes || "",
    });
    setModal({ mode: "edit", vendor });
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
        advance_paid: nextPaid ? (prev.total_amount !== "" ? prev.total_amount : prev.advance_paid) : "",
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      event_id: form.event_id || null,
      total_amount: form.total_amount === "" ? 0 : Number(form.total_amount),
      advance_paid: form.advance_paid === "" ? 0 : Number(form.advance_paid),
    };
    try {
      if (modal.mode === "edit") {
        await api.updateVendor(modal.vendor.id, payload, token);
      } else {
        await api.createVendor(payload, token);
      }
      closeModal();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleDelete(id) {
    setConfirmState({
      message: "Delete this vendor? This cannot be undone.",
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await api.deleteVendor(id, token);
          load();
        } catch (err) {
          setError(err.message);
        }
      },
    });
  }

  function handleBulkDelete() {
    setConfirmState({
      message: `Delete ${selection.selected.size} selected vendor(s)? This cannot be undone.`,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await Promise.all([...selection.selected].map((id) => api.deleteVendor(id, token)));
          selection.clear();
          load();
        } catch (err) {
          setError(err.message);
        }
      },
    });
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Vendors</h1>
          <p className="event-meta">Manage your vendor relationships</p>
        </div>
        <div className="header-actions">
          <button type="button" className="secondary-button" onClick={() => window.print()}>
            <Printer size={16} /> Print
          </button>
          <button type="button" className="button" onClick={openAdd}>
            <Plus size={16} /> Add Vendor
          </button>
        </div>
      </div>

      <div className="print-title">
        <h1>All Vendors</h1>
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
          <h3>All Vendors</h3>
          <p className="event-meta">Track vendor payments and outstanding balances</p>
        </div>

        <div className="search-bar no-print">
          <Search size={15} />
          <input
            placeholder="Search by name, phone, type, or event…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {vendors.length === 0 ? (
          <p>No vendors yet.</p>
        ) : filteredVendors.length === 0 ? (
          <p className="event-meta">No vendors match your search.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th className="no-print checkbox-col">
                  <input type="checkbox" checked={selection.allSelected} onChange={selection.toggleAll} />
                </th>
                <th>Name</th>
                <th>Phone</th>
                <th>Payment Status</th>
                <th>Amount</th>
                <th className="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map((vendor) => {
                const percent = vendor.total_amount > 0
                  ? Math.min(100, Math.round((vendor.advance_paid / vendor.total_amount) * 100))
                  : 0;
                const remaining = Math.max(0, vendor.total_amount - vendor.advance_paid);

                return (
                  <tr key={vendor.id}>
                    <td className="no-print checkbox-col">
                      <input
                        type="checkbox"
                        checked={selection.selected.has(vendor.id)}
                        onChange={() => selection.toggle(vendor.id)}
                      />
                    </td>
                    <td>
                      <strong>{vendor.name}</strong>
                      {vendor.vendor_type && <div className="event-meta">{vendor.vendor_type}</div>}
                    </td>
                    <td>{vendor.phone || "—"}</td>
                    <td>
                      <div className="progress-bar">
                        <div className={`progress-bar-fill ${progressClass(percent)}`} style={{ width: `${percent}%` }} />
                      </div>
                      <span className="event-meta">
                        {percent}% paid • {formatCurrency(remaining)} remaining
                      </span>
                    </td>
                    <td>
                      <strong>{formatCurrency(vendor.total_amount)}</strong>
                      <div className="event-meta">Paid: {formatCurrency(vendor.advance_paid)}</div>
                    </td>
                    <td className="no-print">
                      <div className="action-icons">
                        <button type="button" className="icon-button" title="Print" onClick={() => setReportVendor(vendor)}>
                          <Printer size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          title="Attachments"
                          onClick={() => setAttachmentVendor(vendor)}
                        >
                          <Paperclip size={15} />
                        </button>
                        <button type="button" className="icon-button" title="Edit" onClick={() => openEdit(vendor)}>
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-button icon-button-danger"
                          title="Delete"
                          onClick={() => handleDelete(vendor.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {reportVendor && (
        <VendorReportModal vendor={reportVendor} logo={logo} onClose={() => setReportVendor(null)} />
      )}

      {(modal?.mode === "add" || modal?.mode === "edit") && (
        <Modal
          title={modal.mode === "add" ? "Add New Vendor" : "Edit Vendor"}
          subtitle={modal.mode === "add" ? "Enter vendor details to create a new record" : "Update vendor information"}
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit}>
            <label>
              Name *
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label>
              Phone
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label>
              Vendor Type
              <select
                value={form.vendor_type}
                onChange={(e) => setForm({ ...form, vendor_type: e.target.value })}
              >
                <option value="">Select vendor type</option>
                {VENDOR_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Linked Event
              <select value={form.event_id} onChange={(e) => setForm({ ...form, event_id: e.target.value })}>
                <option value="">Select event (optional)</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Total Amount (₹) *
              <NumberInput
                required
                value={form.total_amount}
                onChange={(v) => setForm({ ...form, total_amount: v })}
              />
            </label>
            <div className="form-row">
              <label>
                Advance Paid (₹)
                <NumberInput value={form.advance_paid} onChange={(v) => setForm({ ...form, advance_paid: v })} />
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
            <label>
              Notes
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
          title="Delete vendor"
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}

      {attachmentVendor && (
        <AttachmentsModal
          entityType="vendor"
          entityId={attachmentVendor.id}
          title={`Attachments — ${attachmentVendor.name}`}
          onClose={() => setAttachmentVendor(null)}
        />
      )}
    </section>
  );
}

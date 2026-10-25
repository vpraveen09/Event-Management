import { useEffect, useMemo, useState } from "react";
import { Plus, Printer, Pencil, Trash2, Paperclip, Search } from "lucide-react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { useSettings } from "../settings.jsx";
import { useSelection } from "../useSelection.js";
import Modal from "../components/Modal.jsx";
import ClientReportModal from "../components/ClientReportModal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import AttachmentsModal from "../components/AttachmentsModal.jsx";

const EMPTY_FORM = { name: "", email: "", phone: "", address: "", notes: "" };

export default function Clients() {
  const { token } = useAuth();
  const { logo } = useSettings();
  const [clients, setClients] = useState([]);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // { mode: 'add' | 'edit', client }
  const [reportClient, setReportClient] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmState, setConfirmState] = useState(null);
  const [search, setSearch] = useState("");
  const [attachmentClient, setAttachmentClient] = useState(null);
  const selection = useSelection(clients);

  function load() {
    Promise.all([api.listClients(token), api.listEvents(token)])
      .then(([clientData, eventData]) => {
        setClients(clientData);
        setEvents(eventData);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(load, [token]);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((c) =>
      [c.name, c.email, c.phone, c.address].some((f) => (f || "").toLowerCase().includes(term))
    );
  }, [clients, search]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setModal({ mode: "add" });
  }

  function openEdit(client) {
    setForm({
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      notes: client.notes || "",
    });
    setModal({ mode: "edit", client });
  }

  function closeModal() {
    setModal(null);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (modal.mode === "edit") {
        await api.updateClient(modal.client.id, form, token);
      } else {
        await api.createClient(form, token);
      }
      closeModal();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleDelete(id) {
    setConfirmState({
      message: "Delete this client? This cannot be undone.",
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await api.deleteClient(id, token);
          load();
        } catch (err) {
          setError(err.message);
        }
      },
    });
  }

  function handleBulkDelete() {
    setConfirmState({
      message: `Delete ${selection.selected.size} selected client(s)? This cannot be undone.`,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await Promise.all([...selection.selected].map((id) => api.deleteClient(id, token)));
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
          <h1>Clients</h1>
          <p className="event-meta">Manage your client relationships</p>
        </div>
        <div className="header-actions">
          <button type="button" className="secondary-button" onClick={() => window.print()}>
            <Printer size={16} /> Print
          </button>
          <button type="button" className="button" onClick={openAdd}>
            <Plus size={16} /> Add Client
          </button>
        </div>
      </div>

      <div className="print-title">
        <h1>All Clients</h1>
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
          <h3>All Clients</h3>
          <p className="event-meta">A list of all your clients and their contact information</p>
        </div>

        <div className="search-bar no-print">
          <Search size={15} />
          <input
            placeholder="Search by name, email, phone, or address…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {clients.length === 0 ? (
          <p>No clients yet.</p>
        ) : filteredClients.length === 0 ? (
          <p className="event-meta">No clients match your search.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th className="no-print checkbox-col">
                  <input type="checkbox" checked={selection.allSelected} onChange={selection.toggleAll} />
                </th>
                <th>Name</th>
                <th>Contact</th>
                <th>Address</th>
                <th className="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id}>
                  <td className="no-print checkbox-col">
                    <input
                      type="checkbox"
                      checked={selection.selected.has(client.id)}
                      onChange={() => selection.toggle(client.id)}
                    />
                  </td>
                  <td>
                    <strong>{client.name}</strong>
                  </td>
                  <td>
                    {client.email && <div>{client.email}</div>}
                    {client.phone && <div className="event-meta">{client.phone}</div>}
                  </td>
                  <td>{client.address || "—"}</td>
                  <td className="no-print">
                    <div className="action-icons">
                      <button
                        type="button"
                        className="icon-button"
                        title="Client report"
                        onClick={() => setReportClient(client)}
                      >
                        <Printer size={15} />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        title="Attachments"
                        onClick={() => setAttachmentClient(client)}
                      >
                        <Paperclip size={15} />
                      </button>
                      <button type="button" className="icon-button" title="Edit" onClick={() => openEdit(client)}>
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="icon-button icon-button-danger"
                        title="Delete"
                        onClick={() => handleDelete(client.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {reportClient && (
        <ClientReportModal
          client={reportClient}
          events={events.filter((e) => e.client_id === reportClient.id)}
          logo={logo}
          onClose={() => setReportClient(null)}
        />
      )}

      {(modal?.mode === "add" || modal?.mode === "edit") && (
        <Modal
          title={modal.mode === "add" ? "Add New Client" : "Edit Client"}
          subtitle={modal.mode === "add" ? "Enter client details to create a new record" : "Update client information"}
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit}>
            <label>
              Name *
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
              Phone
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label>
              Address
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </label>
            <label>
              Notes
              <textarea
                className="notes-field"
                placeholder="Any additional notes about this client…"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
          title="Delete client"
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}

      {attachmentClient && (
        <AttachmentsModal
          entityType="client"
          entityId={attachmentClient.id}
          title={`Attachments — ${attachmentClient.name}`}
          onClose={() => setAttachmentClient(null)}
        />
      )}
    </section>
  );
}

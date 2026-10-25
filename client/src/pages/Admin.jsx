import { useEffect, useState } from "react";
import { Plus, Printer, Trash2, User as UserIcon, KeyRound } from "lucide-react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { useSelection } from "../useSelection.js";
import Modal from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const EMPTY_FORM = { name: "", email: "", phone: "", password: "", role: "user" };

export default function Admin() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmState, setConfirmState] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetDone, setResetDone] = useState(false);
  const selection = useSelection(users);

  function load() {
    api
      .listUsers(token)
      .then(setUsers)
      .catch((err) => setError(err.message));
  }

  useEffect(load, [token]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setModal({ mode: "add" });
  }

  function closeModal() {
    setModal(null);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.createUser(form, token);
      closeModal();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRoleChange(id, role) {
    try {
      await api.updateUserRole(id, role, token);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleDelete(id) {
    setConfirmState({
      message: "Remove this user? This cannot be undone.",
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await api.deleteUser(id, token);
          load();
        } catch (err) {
          setError(err.message);
        }
      },
    });
  }

  function handleBulkDelete() {
    const ids = [...selection.selected].filter((id) => id !== currentUser.id);
    if (ids.length === 0) return;
    setConfirmState({
      message: `Remove ${ids.length} selected user(s)? This cannot be undone.`,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await Promise.all(ids.map((id) => api.deleteUser(id, token)));
          selection.clear();
          load();
        } catch (err) {
          setError(err.message);
        }
      },
    });
  }

  function openResetPassword(user) {
    setResetUser(user);
    setResetPassword("");
    setResetError("");
    setResetDone(false);
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setResetError("");
    try {
      await api.resetUserPassword(resetUser.id, resetPassword, token);
      setResetDone(true);
    } catch (err) {
      setResetError(err.message);
    }
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Admin Panel</h1>
          <p className="event-meta">Manage user roles and permissions</p>
        </div>
        <div className="header-actions">
          <button type="button" className="secondary-button" onClick={() => window.print()}>
            <Printer size={16} /> Print
          </button>
          <button type="button" className="button" onClick={openAdd}>
            <Plus size={16} /> Add User
          </button>
        </div>
      </div>

      <div className="print-title">
        <h1>User Management</h1>
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
          <h3>User Management</h3>
          <p className="event-meta">View and manage user roles in the system</p>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th className="no-print checkbox-col">
                <input type="checkbox" checked={selection.allSelected} onChange={selection.toggleAll} />
              </th>
              <th>Username</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Current Role</th>
              <th className="no-print">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="no-print checkbox-col">
                  <input
                    type="checkbox"
                    checked={selection.selected.has(user.id)}
                    onChange={() => selection.toggle(user.id)}
                  />
                </td>
                <td>
                  <UserIcon size={14} style={{ verticalAlign: "-2px", marginRight: "6px" }} />
                  {user.name}
                </td>
                <td>{user.email}</td>
                <td>{user.phone || "—"}</td>
                <td>
                  <span className={`badge ${user.role === "admin" ? "badge-admin" : "badge-user"}`}>
                    {user.role}
                  </span>
                </td>
                <td className="no-print">
                  {user.id === currentUser.id ? (
                    <span className="event-meta">Current User</span>
                  ) : (
                    <div className="action-icons">
                      <select
                        className="role-select"
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        type="button"
                        className="icon-button"
                        title="Reset Password"
                        onClick={() => openResetPassword(user)}
                      >
                        <KeyRound size={15} />
                      </button>
                      <button
                        type="button"
                        className="icon-button icon-button-danger"
                        title="Delete"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card admin-info">
        <h3>Admin Information</h3>
        <p>
          Total Users: <strong>{users.length}</strong>
        </p>
      </div>

      {modal?.mode === "add" && (
        <Modal title="Add New User" subtitle="Create a new user account" onClose={closeModal}>
          <form onSubmit={handleSubmit}>
            <label>
              Username *
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label>
              Email *
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label>
              Phone
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label>
              Password *
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </label>
            <label>
              Role
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            {error && <p className="error">{error}</p>}
            <div className="modal-footer">
              <button type="button" className="secondary-button" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit">Create</button>
            </div>
          </form>
        </Modal>
      )}

      {confirmState && (
        <ConfirmDialog
          title="Remove user"
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}

      {resetUser && (
        <Modal title={`Reset Password — ${resetUser.name}`} subtitle="Set a new password for this user" onClose={() => setResetUser(null)}>
          <form onSubmit={handleResetPassword}>
            <label>
              New Password
              <input
                type="password"
                required
                minLength={6}
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
              />
            </label>
            {resetError && <p className="error">{resetError}</p>}
            {resetDone && <p className="success">Password reset successfully.</p>}
            <div className="modal-footer">
              <button type="button" className="secondary-button" onClick={() => setResetUser(null)}>
                Close
              </button>
              <button type="submit">Reset Password</button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}

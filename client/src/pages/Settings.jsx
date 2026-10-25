import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, Save, Download, KeyRound } from "lucide-react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { useSettings } from "../settings.jsx";

const MAX_SIZE = 5 * 1024 * 1024;

async function downloadFile(path, filename, token) {
  const res = await fetch(`/api${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Settings() {
  const { token } = useAuth();
  const settings = useSettings();
  const [logo, setLogo] = useState(settings.logo);
  const [appName, setAppName] = useState(settings.app_name);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [exportError, setExportError] = useState("");
  const fileInputRef = useRef(null);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    setLogo(settings.logo);
    setAppName(settings.app_name);
  }, [settings.logo, settings.app_name]);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    if (file.size > MAX_SIZE) {
      setError("Logo must be smaller than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const updated = await api.updateSettings({ logo: reader.result }, token);
        settings.setSettings(updated);
      } catch (err) {
        setError(err.message);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleRemoveLogo() {
    try {
      const updated = await api.updateSettings({ logo: null }, token);
      settings.setSettings(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSaveName(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    try {
      const updated = await api.updateSettings({ app_name: appName }, token);
      settings.setSettings(updated);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleExport(path, filename) {
    setExportError("");
    try {
      await downloadFile(path, filename, token);
    } catch (err) {
      setExportError(err.message);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSaved(false);
    try {
      await api.changePassword(passwordForm, token);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setPasswordSaved(true);
    } catch (err) {
      setPasswordError(err.message);
    }
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="event-meta">Manage your application settings</p>
        </div>
      </div>

      <div className="card">
        <div className="card-heading">
          <h3>Application Name</h3>
          <p className="event-meta">Shown in the navigation bar and throughout the app.</p>
        </div>
        <form onSubmit={handleSaveName} className="inline-form">
          <input
            value={appName}
            onChange={(e) => {
              setAppName(e.target.value);
              setSaved(false);
            }}
            required
          />
          <button type="submit">
            <Save size={16} /> Save
          </button>
        </form>
        {saved && <p className="success">Application name updated.</p>}
      </div>

      <div className="card">
        <div className="card-heading">
          <h3>Application Logo</h3>
          <p className="event-meta">Upload a custom logo for your application. Maximum file size: 5MB.</p>
        </div>

        <p className="event-meta" style={{ marginTop: "1rem" }}>
          Current Logo
        </p>
        <div className="logo-settings">
          <div className="logo-preview">
            {logo ? <img src={logo} alt="Application logo" /> : <span className="event-meta">No logo</span>}
          </div>
          <div className="logo-actions">
            <button type="button" className="secondary-button" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} /> Change Logo
            </button>
            {logo && (
              <button type="button" className="danger-button" onClick={handleRemoveLogo}>
                <Trash2 size={16} /> Remove Logo
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
          </div>
        </div>
        {error && <p className="error">{error}</p>}
      </div>

      <div className="card">
        <div className="card-heading">
          <h3>Export Data</h3>
          <p className="event-meta">Download your data as CSV, or export your event schedule as a calendar file.</p>
        </div>
        <div className="export-buttons">
          <button type="button" className="secondary-button" onClick={() => handleExport("/export/clients.csv", "clients.csv")}>
            <Download size={16} /> Clients CSV
          </button>
          <button type="button" className="secondary-button" onClick={() => handleExport("/export/events.csv", "events.csv")}>
            <Download size={16} /> Events CSV
          </button>
          <button type="button" className="secondary-button" onClick={() => handleExport("/export/vendors.csv", "vendors.csv")}>
            <Download size={16} /> Vendors CSV
          </button>
          <button type="button" className="secondary-button" onClick={() => handleExport("/export/events.ics", "events.ics")}>
            <Download size={16} /> Calendar (.ics)
          </button>
        </div>
        {exportError && <p className="error">{exportError}</p>}
      </div>

      <div className="card">
        <div className="card-heading">
          <h3>Change Password</h3>
          <p className="event-meta">Update the password for your own account.</p>
        </div>
        <form onSubmit={handleChangePassword}>
          <label>
            Current Password
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            />
          </label>
          <label>
            New Password
            <input
              type="password"
              required
              minLength={6}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            />
          </label>
          {passwordError && <p className="error">{passwordError}</p>}
          {passwordSaved && <p className="success">Password updated.</p>}
          <button type="submit">
            <KeyRound size={16} /> Update Password
          </button>
        </form>
      </div>
    </section>
  );
}

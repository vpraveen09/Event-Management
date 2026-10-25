import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, FileText, Download } from "lucide-react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import Modal from "./Modal.jsx";

const MAX_SIZE = 8 * 1024 * 1024;

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentsModal({ entityType, entityId, title, onClose }) {
  const { token } = useAuth();
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  function load() {
    api
      .listAttachments(entityType, entityId, token)
      .then(setAttachments)
      .catch((err) => setError(err.message));
  }

  useEffect(load, [entityType, entityId, token]);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    if (file.size > MAX_SIZE) {
      setError("File must be smaller than 8MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result.split(",")[1];
        await api.createAttachment(
          { entity_type: entityType, entity_id: entityId, filename: file.name, mime_type: file.type, data: base64 },
          token
        );
        load();
      } catch (err) {
        setError(err.message);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleDelete(id) {
    try {
      await api.deleteAttachment(id, token);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDownload(attachment) {
    try {
      const full = await api.downloadAttachment(attachment.id, token);
      const link = document.createElement("a");
      link.href = `data:${full.mime_type || "application/octet-stream"};base64,${full.data}`;
      link.download = full.filename;
      link.click();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal title={title} subtitle="Contracts, invoices, and photos" onClose={onClose}>
      <button type="button" className="secondary-button" onClick={() => fileInputRef.current?.click()}>
        <Upload size={16} /> Upload File
      </button>
      <input ref={fileInputRef} type="file" hidden onChange={handleFileChange} />

      {error && <p className="error">{error}</p>}

      {attachments.length === 0 ? (
        <p className="event-meta" style={{ marginTop: "0.8rem" }}>
          No files yet.
        </p>
      ) : (
        <ul className="attachment-list">
          {attachments.map((a) => (
            <li key={a.id}>
              <FileText size={16} />
              <div className="attachment-info">
                <span>{a.filename}</span>
                <span className="event-meta">{formatSize(a.size)}</span>
              </div>
              <button type="button" className="icon-button" title="Download" onClick={() => handleDownload(a)}>
                <Download size={14} />
              </button>
              <button
                type="button"
                className="icon-button icon-button-danger"
                title="Delete"
                onClick={() => handleDelete(a.id)}
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

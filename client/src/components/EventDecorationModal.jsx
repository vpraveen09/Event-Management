import { useEffect, useState } from "react";
import { Image as ImageIcon, Images, Trash2 } from "lucide-react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import Modal from "./Modal.jsx";

export default function EventDecorationModal({ event, onClose, onChooseFromGallery }) {
  const { token } = useAuth();
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");

  function load() {
    api
      .listEventDecorationImages(event.id, token)
      .then(setImages)
      .catch((err) => setError(err.message));
  }

  useEffect(load, [event.id, token]);

  async function handleRemove(sceneryImageId) {
    try {
      await api.removeEventDecorationImage(event.id, sceneryImageId, token);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal
      title={`Decoration Photos — ${event.name}`}
      subtitle={images.length ? `${images.length} photo(s) selected` : "No photos selected yet"}
      onClose={onClose}
      size="wide"
    >
      {error && <p className="error">{error}</p>}

      {images.length === 0 ? (
        <div className="empty-state">
          <ImageIcon size={28} />
          <p>No decoration photos have been chosen for this event yet.</p>
        </div>
      ) : (
        <div className="scenery-grid">
          {images.map((img) => (
            <div key={img.id} className="scenery-card">
              <div className="scenery-card-media">
                <img src={`data:${img.mime_type || "image/jpeg"};base64,${img.data}`} alt={img.caption || img.filename} />
              </div>
              <span className="scenery-card-theme">{img.theme || "Other"}</span>
              <div className="scenery-card-footer">
                <span>{img.caption || img.filename}</span>
                <button
                  type="button"
                  className="icon-button icon-button-danger"
                  title="Remove"
                  onClick={() => handleRemove(img.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="modal-footer">
        <button type="button" className="secondary-button" onClick={onClose}>
          Close
        </button>
        <button type="button" onClick={onChooseFromGallery}>
          <Images size={16} /> Add Photos
        </button>
      </div>
    </Modal>
  );
}

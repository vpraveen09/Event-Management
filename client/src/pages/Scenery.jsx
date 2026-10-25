import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Upload, Trash2, Image as ImageIcon, Eye, ChevronLeft, ChevronRight, CheckCircle2, Circle, X, Check } from "lucide-react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Modal from "../components/Modal.jsx";

const MAX_SIZE = 8 * 1024 * 1024;

const THEMES = [
  "Wedding",
  "Reception",
  "Engagement",
  "Haldi",
  "Mehendi",
  "Sangeet",
  "Birthday",
  "Baby Shower",
  "Naming Ceremony",
  "Anniversary",
  "Housewarming",
  "Corporate",
  "Festival",
  "Other",
];

export default function Scenery() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const selectingEventId = location.state?.eventId || null;
  const selectingEventName = location.state?.eventName || "";
  const [images, setImages] = useState([]);
  const [caption, setCaption] = useState("");
  const [theme, setTheme] = useState(THEMES[0]);
  const [activeTab, setActiveTab] = useState("All");
  const [error, setError] = useState("");
  const [confirmState, setConfirmState] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const fileInputRef = useRef(null);

  function load() {
    api
      .listScenery(token)
      .then(setImages)
      .catch((err) => setError(err.message));
  }

  useEffect(load, [token]);

  useEffect(() => {
    if (!selectingEventId) return;
    api
      .listEventDecorationImages(selectingEventId, token)
      .then((imgs) => setSelectedIds(new Set(imgs.map((i) => i.id))))
      .catch((err) => setError(err.message));
  }, [selectingEventId, token]);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    if (file.size > MAX_SIZE) {
      setError("Image must be smaller than 8MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result.split(",")[1];
        await api.createScenery(
          { filename: file.name, mime_type: file.type, data: base64, caption: caption.trim() || null, theme },
          token
        );
        setCaption("");
        load();
      } catch (err) {
        setError(err.message);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const filteredImages = useMemo(() => {
    if (activeTab === "All") return images;
    return images.filter((img) => (img.theme || "Other") === activeTab);
  }, [images, activeTab]);

  const previewImage = previewIndex != null ? filteredImages[previewIndex] : null;

  function showPrev() {
    setPreviewIndex((i) => (i - 1 + filteredImages.length) % filteredImages.length);
  }

  function showNext() {
    setPreviewIndex((i) => (i + 1) % filteredImages.length);
  }

  useEffect(() => {
    if (previewIndex == null) return;
    function handleKey(e) {
      if (e.key === "ArrowLeft") showPrev();
      else if (e.key === "ArrowRight") showNext();
      else if (e.key === "Escape") setPreviewIndex(null);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [previewIndex, filteredImages.length]);

  async function toggleSelectForEvent(imageId) {
    if (!selectingEventId) return;
    const isSelected = selectedIds.has(imageId);
    try {
      if (isSelected) {
        await api.removeEventDecorationImage(selectingEventId, imageId, token);
      } else {
        await api.addEventDecorationImage(selectingEventId, imageId, token);
      }
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (isSelected) next.delete(imageId);
        else next.add(imageId);
        return next;
      });
    } catch (err) {
      setError(err.message);
    }
  }

  function handleDone() {
    navigate("/events", { state: { showDecorationFor: selectingEventId } });
  }

  function handleDelete(id) {
    setConfirmState({
      message: "Delete this image? This cannot be undone.",
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await api.deleteScenery(id, token);
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
          <h1>Scenery</h1>
          <p className="event-meta">Decoration and venue photo gallery for reference and client inspiration</p>
        </div>
      </div>

      {selectingEventId && (
        <div className="scenery-selecting-banner">
          <span>
            Choosing decoration photos for <strong>{selectingEventName}</strong> — select as many as you like, then
            click Done. ({selectedIds.size} selected)
          </span>
          <div className="scenery-selecting-actions">
            <button type="button" className="button" onClick={handleDone}>
              <Check size={15} /> Done
            </button>
            <button type="button" className="icon-button" title="Cancel" onClick={() => navigate("/events")}>
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-heading">
          <h3>Upload Decoration Image</h3>
          <p className="event-meta">Maximum file size: 8MB.</p>
        </div>
        <div className="scenery-upload-row">
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            {THEMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            placeholder="Caption, e.g. Stage decoration"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <button type="button" className="secondary-button" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} /> Upload Photo
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
        </div>
        {error && <p className="error">{error}</p>}
      </div>

      <div className="card">
        <div className="card-heading card-heading-row">
          <div>
            <h3>Gallery</h3>
            <p className="event-meta">{filteredImages.length} of {images.length} photo(s)</p>
          </div>
        </div>

        <div className="chart-tabs" style={{ marginBottom: "1rem" }}>
          <button
            type="button"
            className={activeTab === "All" ? "chart-tab chart-tab-active" : "chart-tab"}
            onClick={() => setActiveTab("All")}
          >
            All
          </button>
          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              className={activeTab === t ? "chart-tab chart-tab-active" : "chart-tab"}
              onClick={() => {
                setActiveTab(t);
                setTheme(t);
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {filteredImages.length === 0 ? (
          <div className="empty-state">
            <ImageIcon size={28} />
            <p>{images.length === 0 ? "No decoration photos yet." : `No photos tagged "${activeTab}" yet.`}</p>
          </div>
        ) : (
          <div className="scenery-grid">
            {filteredImages.map((img, index) => (
              <div key={img.id} className="scenery-card">
                <div className="scenery-card-media">
                  <img src={`data:${img.mime_type || "image/jpeg"};base64,${img.data}`} alt={img.caption || img.filename} />
                  <button
                    type="button"
                    className="scenery-card-view"
                    title="View full image"
                    onClick={() => setPreviewIndex(index)}
                  >
                    <Eye size={18} />
                  </button>
                </div>
                <span className="scenery-card-theme">{img.theme || "Other"}</span>
                <div className="scenery-card-footer">
                  <span>{img.caption || img.filename}</span>
                  <button
                    type="button"
                    className="icon-button icon-button-danger"
                    title="Delete"
                    onClick={() => handleDelete(img.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {selectingEventId && (
                  <button
                    type="button"
                    className={selectedIds.has(img.id) ? "scenery-select-button scenery-select-button-active" : "secondary-button scenery-select-button"}
                    onClick={() => toggleSelectForEvent(img.id)}
                  >
                    {selectedIds.has(img.id) ? (
                      <>
                        <CheckCircle2 size={14} /> Selected
                      </>
                    ) : (
                      <>
                        <Circle size={14} /> Select
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmState && (
        <ConfirmDialog
          title="Delete photo"
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}

      {previewImage && (
        <Modal
          title={previewImage.caption || previewImage.filename}
          subtitle={`${previewImage.theme || "Other"} • ${previewIndex + 1} of ${filteredImages.length}`}
          onClose={() => setPreviewIndex(null)}
          size="wide"
        >
          <div className="scenery-preview-wrap">
            {filteredImages.length > 1 && (
              <button type="button" className="scenery-preview-nav scenery-preview-prev" onClick={showPrev} title="Previous">
                <ChevronLeft size={22} />
              </button>
            )}
            <img
              src={`data:${previewImage.mime_type || "image/jpeg"};base64,${previewImage.data}`}
              alt={previewImage.caption || previewImage.filename}
              className="scenery-preview-image"
            />
            {filteredImages.length > 1 && (
              <button type="button" className="scenery-preview-nav scenery-preview-next" onClick={showNext} title="Next">
                <ChevronRight size={22} />
              </button>
            )}
          </div>
          {selectingEventId && (
            <div className="modal-footer">
              <button
                type="button"
                className={selectedIds.has(previewImage.id) ? "secondary-button" : ""}
                onClick={() => toggleSelectForEvent(previewImage.id)}
              >
                <CheckCircle2 size={16} />{" "}
                {selectedIds.has(previewImage.id) ? "Selected — click to remove" : `Select for ${selectingEventName}`}
              </button>
            </div>
          )}
        </Modal>
      )}
    </section>
  );
}

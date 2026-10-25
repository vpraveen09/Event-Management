import { X } from "lucide-react";

export default function Modal({ title, subtitle, onClose, children, size, headerExtra }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${size === "wide" ? "modal-wide" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p className="event-meta">{subtitle}</p>}
          </div>
          <div className="modal-header-right">
            {headerExtra}
            <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

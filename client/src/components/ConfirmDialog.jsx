export default function ConfirmDialog({
  title = "Confirm",
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-confirm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
          </div>
        </div>
        <div className="modal-body">
          <p>{message}</p>
          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className="danger-button" onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

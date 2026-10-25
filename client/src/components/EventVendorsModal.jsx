import { Truck } from "lucide-react";
import Modal from "./Modal.jsx";
import { formatCurrency } from "../format.js";

export default function EventVendorsModal({ event, vendors, onClose }) {
  const totalAmount = vendors.reduce((sum, v) => sum + (Number(v.total_amount) || 0), 0);
  const totalAdvance = vendors.reduce((sum, v) => sum + (Number(v.advance_paid) || 0), 0);
  const totalBalance = Math.max(0, totalAmount - totalAdvance);

  return (
    <Modal
      title={`Vendors — ${event.name}`}
      subtitle="All vendors assigned to this event"
      onClose={onClose}
    >
      {vendors.length === 0 ? (
        <p className="event-meta">No vendors assigned to this event yet. Assign one from the Vendors page.</p>
      ) : (
        <>
          <ul className="attachment-list">
            {vendors.map((v) => {
              const balance = Math.max(0, (Number(v.total_amount) || 0) - (Number(v.advance_paid) || 0));
              return (
                <li key={v.id}>
                  <Truck size={16} />
                  <div className="attachment-info">
                    <span>
                      {v.name}
                      {v.vendor_type ? ` — ${v.vendor_type}` : ""}
                    </span>
                    <span className="event-meta">
                      Total {formatCurrency(v.total_amount)} • Paid {formatCurrency(v.advance_paid)} •{" "}
                      {balance > 0 ? (
                        <span className="profit-negative">{formatCurrency(balance)} due</span>
                      ) : (
                        <span className="profit-positive">Settled</span>
                      )}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="stat-row" style={{ marginTop: "0.9rem" }}>
            <div className="stat-box">
              <span className="event-meta">Total Cost</span>
              <strong>{formatCurrency(totalAmount)}</strong>
            </div>
            <div className="stat-box">
              <span className="event-meta">Paid</span>
              <strong className="profit-positive">{formatCurrency(totalAdvance)}</strong>
            </div>
            <div className="stat-box">
              <span className="event-meta">Balance Due</span>
              <strong className={totalBalance > 0 ? "profit-negative" : "profit-positive"}>
                {formatCurrency(totalBalance)}
              </strong>
            </div>
          </div>
        </>
      )}

      <div className="modal-footer">
        <button type="button" className="secondary-button" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}

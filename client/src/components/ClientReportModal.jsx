import { Printer } from "lucide-react";
import Modal from "./Modal.jsx";
import { formatCurrency, formatNumber } from "../format.js";
import { openReportWindow } from "../print.js";
import { buildClientReportHtml } from "../reports.js";
import { useSettings } from "../settings.jsx";

export default function ClientReportModal({ client, events, logo, onClose }) {
  const { app_name } = useSettings();
  const totalBudget = events.reduce((sum, e) => sum + (Number(e.budget) || 0), 0);
  const totalAdvance = events.reduce((sum, e) => sum + (Number(e.advance) || 0), 0);
  const totalReceived = events.reduce((sum, e) => sum + (Number(e.received_amount) || 0), 0);

  function handlePrint() {
    openReportWindow(`Client Report - ${client.name}`, buildClientReportHtml(client, events, logo, app_name));
  }

  return (
    <Modal
      title="Client Report"
      subtitle={`Generated on ${new Date().toLocaleDateString(undefined, { dateStyle: "long" })}`}
      onClose={onClose}
      size="wide"
      headerExtra={logo ? <img src={logo} alt="Logo" className="report-logo" /> : null}
    >
      <h3 className="report-section-title">Client Information</h3>
      <div className="info-box">
        <div>
          <span className="event-meta">Name</span>
          <p>{client.name}</p>
        </div>
        <div>
          <span className="event-meta">Email</span>
          <p>{client.email || "—"}</p>
        </div>
        <div>
          <span className="event-meta">Phone</span>
          <p>{client.phone || "—"}</p>
        </div>
        <div>
          <span className="event-meta">Address</span>
          <p>{client.address || "—"}</p>
        </div>
        {client.notes && (
          <div className="info-box-full">
            <span className="event-meta">Notes</span>
            <p>{client.notes}</p>
          </div>
        )}
      </div>

      <h3 className="report-section-title">Associated Events ({events.length})</h3>
      {events.length === 0 ? (
        <p className="event-meta">No events for this client yet.</p>
      ) : (
        events.map((e) => (
          <div key={e.id} className="event-card">
            <div className="event-card-header">
              <div>
                <strong>{e.name}</strong>
                <div className="event-meta">{e.event_type}</div>
              </div>
              <span className={`badge badge-status-${e.status?.toLowerCase()}`}>{e.status}</span>
            </div>
            <div className="info-box">
              <div>
                <span className="event-meta">Date &amp; Time</span>
                <p>
                  {new Date(`${e.date}T${e.time || "00:00"}`).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <div>
                <span className="event-meta">Location</span>
                <p>{e.location || "—"}</p>
              </div>
              <div>
                <span className="event-meta">Guests</span>
                <p>{e.guest_count != null ? formatNumber(e.guest_count) : "—"}</p>
              </div>
              <div>
                <span className="event-meta">Budget</span>
                <p>{e.budget != null ? formatCurrency(e.budget) : "—"}</p>
              </div>
              <div>
                <span className="event-meta">Advance</span>
                <p>{e.advance != null ? formatCurrency(e.advance) : "—"}</p>
              </div>
              <div>
                <span className="event-meta">Received Amount</span>
                <p className="text-green">{e.received_amount != null ? formatCurrency(e.received_amount) : "—"}</p>
              </div>
            </div>
          </div>
        ))
      )}

      <div className="stat-row">
        <div className="stat-box">
          <span className="event-meta">Total Events</span>
          <strong>{formatNumber(events.length)}</strong>
        </div>
        <div className="stat-box">
          <span className="event-meta">Total Budget</span>
          <strong>{formatCurrency(totalBudget)}</strong>
        </div>
        <div className="stat-box">
          <span className="event-meta">Total Advance</span>
          <strong>{formatCurrency(totalAdvance)}</strong>
        </div>
        <div className="stat-box">
          <span className="event-meta">Total Received</span>
          <strong className="text-green">{formatCurrency(totalReceived)}</strong>
        </div>
      </div>

      <div className="modal-footer">
        <button type="button" className="secondary-button" onClick={onClose}>
          Close
        </button>
        <button type="button" onClick={handlePrint}>
          <Printer size={16} /> Print Report
        </button>
      </div>
    </Modal>
  );
}

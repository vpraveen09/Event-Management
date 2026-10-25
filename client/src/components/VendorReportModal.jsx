import { Printer, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import Modal from "./Modal.jsx";
import { formatCurrency } from "../format.js";
import { openReportWindow } from "../print.js";
import { buildVendorReportHtml } from "../reports.js";
import { useSettings } from "../settings.jsx";

export default function VendorReportModal({ vendor, logo, onClose }) {
  const { app_name } = useSettings();
  const percent = vendor.total_amount > 0
    ? Math.min(100, Math.round((vendor.advance_paid / vendor.total_amount) * 100))
    : 0;
  const balance = Math.max(0, vendor.total_amount - vendor.advance_paid);
  const colorClass = percent >= 100 ? "green" : percent > 0 ? "yellow" : "red";
  const statusLabel = percent >= 100 ? "Paid" : percent > 0 ? "Partially Paid" : "Unpaid";
  const StatusIcon = percent >= 100 ? CheckCircle2 : percent > 0 ? AlertTriangle : XCircle;

  function handlePrint() {
    openReportWindow(`Vendor Report - ${vendor.name}`, buildVendorReportHtml(vendor, logo, app_name));
  }

  return (
    <Modal
      title="Vendor Payment Report"
      subtitle={`Generated on ${new Date().toLocaleDateString(undefined, { dateStyle: "long" })}`}
      onClose={onClose}
      headerExtra={logo ? <img src={logo} alt="Logo" className="report-logo" /> : null}
    >
      <h3 className="report-section-title">Vendor Information</h3>
      <div className="info-box">
        <div>
          <span className="event-meta">Name</span>
          <p>{vendor.name}</p>
        </div>
        <div>
          <span className="event-meta">Service Type</span>
          <p>{vendor.vendor_type || "N/A"}</p>
        </div>
        <div>
          <span className="event-meta">Phone</span>
          <p>{vendor.phone || "—"}</p>
        </div>
        <div>
          <span className="event-meta">Event</span>
          <p>{vendor.event_name || "N/A"}</p>
        </div>
        {vendor.notes && (
          <div className="info-box-full">
            <span className="event-meta">Notes</span>
            <p>{vendor.notes}</p>
          </div>
        )}
      </div>

      <h3 className="report-section-title">Payment Details</h3>
      <div className="stat-row">
        <div className="stat-box">
          <span className="event-meta">Total Amount</span>
          <strong>{formatCurrency(vendor.total_amount)}</strong>
        </div>
        <div className="stat-box">
          <span className="event-meta">Advance Paid</span>
          <strong className="text-green">{formatCurrency(vendor.advance_paid)}</strong>
        </div>
        <div className="stat-box">
          <span className="event-meta">Balance Due</span>
          <strong className="text-red">{formatCurrency(balance)}</strong>
        </div>
      </div>

      <div className="report-progress">
        <div className="report-progress-label">
          <span>Payment Progress</span>
          <strong>{percent}%</strong>
        </div>
        <div className="progress-bar">
          <div className={`progress-bar-fill progress-${colorClass}`} style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className={`payment-status payment-status-${colorClass}`}>
        <span className="event-meta">Payment Status</span>
        <p>
          <StatusIcon size={15} /> {statusLabel}
        </p>
      </div>

      <p className="footer-note">This is a computer-generated report. No signature required.</p>

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

import { formatCurrency, formatNumber } from "./format.js";

const STATUS_COLORS = {
  confirm: { bg: "#eaf5ff", color: "#1f7cc9" },
  ongoing: { bg: "#fef3c7", color: "#b45309" },
  completed: { bg: "#dcfce7", color: "#15803d" },
  cancelled: { bg: "#fee2e2", color: "#dc2626" },
};

function statusBadge(status) {
  const key = (status || "").toLowerCase();
  const c = STATUS_COLORS[key] || { bg: "#eaf5ff", color: "#1f7cc9" };
  return `<span class="badge" style="background:${c.bg};color:${c.color}">${status}</span>`;
}

function progressColor(percent) {
  if (percent >= 100) return "#16a34a";
  if (percent > 0) return "#f59e0b";
  return "#dc2626";
}

function buildLetterhead(appName, logo) {
  return `
    <div class="letterhead">
      ${logo ? `<img src="${logo}" alt="Logo" class="letterhead-logo" />` : ""}
      <div class="letterhead-name">${appName || "Event Manager"}</div>
    </div>
  `;
}

export function buildClientReportHtml(client, events, logo, appName) {
  const totalBudget = events.reduce((sum, e) => sum + (Number(e.budget) || 0), 0);
  const totalAdvance = events.reduce((sum, e) => sum + (Number(e.advance) || 0), 0);
  const totalReceived = events.reduce((sum, e) => sum + (Number(e.received_amount) || 0), 0);

  const eventCards = events
    .map(
      (e) => `
      <div class="event-card">
        <div class="event-card-header">
          <div>
            <strong>${e.name}</strong>
            <div class="muted">${e.event_type || ""}</div>
          </div>
          ${statusBadge(e.status)}
        </div>
        <div class="info-box">
          <div><label>Date &amp; Time</label><strong>${new Date(`${e.date}T${e.time || "00:00"}`).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</strong></div>
          <div><label>Location</label><strong>${e.location || "—"}</strong></div>
          <div><label>Guests</label><strong>${e.guest_count != null ? formatNumber(e.guest_count) : "—"}</strong></div>
          <div><label>Budget</label><strong>${e.budget != null ? formatCurrency(e.budget) : "—"}</strong></div>
          <div><label>Advance</label><strong>${e.advance != null ? formatCurrency(e.advance) : "—"}</strong></div>
          <div><label>Received Amount</label><strong class="green">${e.received_amount != null ? formatCurrency(e.received_amount) : "—"}</strong></div>
        </div>
      </div>
    `
    )
    .join("");

  return `
    ${buildLetterhead(appName, logo)}
    <div class="event-card-header">
      <div>
        <h1>Client Report</h1>
        <p class="muted">Generated on ${new Date().toLocaleDateString(undefined, { dateStyle: "long" })}</p>
      </div>
    </div>

    <h2>Client Information</h2>
    <div class="info-box">
      <div><label>Name</label><strong>${client.name}</strong></div>
      <div><label>Email</label><strong>${client.email || "—"}</strong></div>
      <div><label>Phone</label><strong>${client.phone || "—"}</strong></div>
      <div><label>Address</label><strong>${client.address || "—"}</strong></div>
      ${client.notes ? `<div class="full"><label>Notes</label><strong>${client.notes}</strong></div>` : ""}
    </div>

    <h2>Associated Events (${events.length})</h2>
    ${eventCards || '<p class="muted">No events for this client yet.</p>'}

    <div class="stat-row">
      <div class="stat-box"><label>Total Events</label><strong>${formatNumber(events.length)}</strong></div>
      <div class="stat-box"><label>Total Budget</label><strong>${formatCurrency(totalBudget)}</strong></div>
      <div class="stat-box"><label>Total Advance</label><strong>${formatCurrency(totalAdvance)}</strong></div>
      <div class="stat-box"><label>Total Received</label><strong class="green">${formatCurrency(totalReceived)}</strong></div>
    </div>
  `;
}

export function buildEventInvoiceHtml(event, logo, appName) {
  const balance = Math.max(0, (Number(event.budget) || 0) - (Number(event.received_amount) || 0));

  return `
    ${buildLetterhead(appName, logo)}
    <div class="event-card-header">
      <div>
        <h1>Invoice</h1>
        <p class="muted">Generated on ${new Date().toLocaleDateString(undefined, { dateStyle: "long" })}</p>
      </div>
    </div>

    <h2>Bill To</h2>
    <div class="info-box">
      <div><label>Client</label><strong>${event.client_name || "—"}</strong></div>
    </div>

    <h2>Event</h2>
    <div class="info-box">
      <div><label>Event</label><strong>${event.name}</strong></div>
      <div><label>Type</label><strong>${event.event_type || "—"}</strong></div>
      <div><label>Date &amp; Time</label><strong>${new Date(`${event.date}T${event.time || "00:00"}`).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</strong></div>
      <div><label>Location</label><strong>${event.location || "—"}</strong></div>
    </div>

    <h2>Billing Summary</h2>
    <div class="stat-row">
      <div class="stat-box"><label>Total (Budget)</label><strong>${formatCurrency(event.budget)}</strong></div>
      <div class="stat-box"><label>Advance</label><strong>${formatCurrency(event.advance)}</strong></div>
      <div class="stat-box"><label>Received</label><strong class="green">${formatCurrency(event.received_amount)}</strong></div>
      <div class="stat-box"><label>Balance Due</label><strong class="${balance > 0 ? "red" : "green"}">${formatCurrency(balance)}</strong></div>
    </div>

    <p class="footer-note">This is a computer-generated invoice. No signature required.</p>
  `;
}

export function buildVendorReportHtml(vendor, logo, appName) {
  const percent = vendor.total_amount > 0 ? Math.min(100, Math.round((vendor.advance_paid / vendor.total_amount) * 100)) : 0;
  const balance = Math.max(0, vendor.total_amount - vendor.advance_paid);
  const statusLabel = percent >= 100 ? "Paid" : percent > 0 ? "Partially Paid" : "Unpaid";
  const statusClass = percent >= 100 ? "green" : percent > 0 ? "orange" : "red";

  return `
    ${buildLetterhead(appName, logo)}
    <div class="event-card-header">
      <div>
        <h1>Vendor Payment Report</h1>
        <p class="muted">Generated on ${new Date().toLocaleDateString(undefined, { dateStyle: "long" })}</p>
      </div>
    </div>

    <h2>Vendor Information</h2>
    <div class="info-box">
      <div><label>Name</label><strong>${vendor.name}</strong></div>
      <div><label>Service Type</label><strong>${vendor.vendor_type || "N/A"}</strong></div>
      <div><label>Phone</label><strong>${vendor.phone || "—"}</strong></div>
      <div><label>Event</label><strong>${vendor.event_name || "N/A"}</strong></div>
      ${vendor.notes ? `<div class="full"><label>Notes</label><strong>${vendor.notes}</strong></div>` : ""}
    </div>

    <h2>Payment Details</h2>
    <div class="stat-row">
      <div class="stat-box"><label>Total Amount</label><strong>${formatCurrency(vendor.total_amount)}</strong></div>
      <div class="stat-box"><label>Advance Paid</label><strong class="green">${formatCurrency(vendor.advance_paid)}</strong></div>
      <div class="stat-box"><label>Balance Due</label><strong class="red">${formatCurrency(balance)}</strong></div>
    </div>

    <div style="margin-top:1rem">
      <div style="display:flex;justify-content:space-between;font-size:0.85rem;color:#6b6b7b">
        <span>Payment Progress</span><strong>${percent}%</strong>
      </div>
      <div class="progress-bar"><div class="progress-bar-fill" style="width:${percent}%;background:${progressColor(percent)}"></div></div>
    </div>

    <div class="info-box" style="margin-top:1rem">
      <div class="full"><label>Payment Status</label><strong class="${statusClass}">${statusLabel}</strong></div>
    </div>

    <p class="footer-note">This is a computer-generated report. No signature required.</p>
  `;
}

export function printRecord(title, fields) {
  const rows = fields
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([label, value]) => `<tr><th>${label}</th><td>${value}</td></tr>`)
    .join("");

  openReportWindow(title, `<table>${rows}</table>`);
}

export function openReportWindow(title, bodyHtml) {
  const win = window.open("", "_blank", "width=680,height=780");
  if (!win) return;

  win.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: system-ui, sans-serif; padding: 2rem; color: #1c1c28; }
          .letterhead { display: flex; align-items: center; gap: 0.9rem; padding-bottom: 1rem; margin-bottom: 1.2rem; border-bottom: 2px solid #1c1c28; }
          .letterhead-logo { width: 56px; height: 56px; border-radius: 10px; object-fit: cover; }
          .letterhead-name { font-size: 1.5rem; font-weight: 800; letter-spacing: 0.01em; }
          h1 { font-size: 1.3rem; margin: 0 0 0.2rem; }
          h2 { font-size: 1rem; margin: 1.4rem 0 0.6rem; }
          .muted { color: #6b6b7b; font-size: 0.85rem; }
          table { width: 100%; border-collapse: collapse; }
          th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #e5e7f0; font-size: 0.95rem; }
          th { color: #6b6b7b; font-weight: 600; width: 40%; }
          .info-box { background: #f5f6fb; border: 1px solid #e5e7f0; border-radius: 10px; padding: 1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
          .info-box .full { grid-column: 1 / -1; }
          .info-box label { display: block; font-size: 0.75rem; color: #6b6b7b; margin-bottom: 0.15rem; }
          .info-box strong { font-size: 0.95rem; }
          .stat-row { display: flex; gap: 0.8rem; margin: 0.8rem 0; }
          .stat-box { flex: 1; border: 1px solid #e5e7f0; border-radius: 10px; padding: 0.8rem; text-align: center; }
          .stat-box label { display: block; font-size: 0.75rem; color: #6b6b7b; margin-bottom: 0.3rem; }
          .stat-box strong { font-size: 1.1rem; }
          .green { color: #15803d; }
          .red { color: #dc2626; }
          .orange { color: #b45309; }
          .event-card { border: 1px solid #e5e7f0; border-radius: 10px; padding: 0.9rem; margin-bottom: 0.7rem; }
          .event-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.6rem; }
          .badge { display: inline-block; padding: 0.15rem 0.55rem; border-radius: 999px; font-size: 0.72rem; font-weight: 600; background: #eaf5ff; color: #1f7cc9; text-transform: capitalize; }
          .progress-bar { height: 8px; border-radius: 999px; background: #e5e7f0; overflow: hidden; margin: 0.5rem 0; }
          .progress-bar-fill { height: 100%; border-radius: 999px; }
          .footer-note { text-align: center; color: #6b6b7b; font-size: 0.8rem; margin-top: 2rem; border-top: 1px solid #e5e7f0; padding-top: 1rem; }
        </style>
      </head>
      <body>
        ${bodyHtml}
      </body>
    </html>
  `);
  win.document.close();

  function triggerPrint() {
    win.focus();
    win.print();
  }

  // Wait for layout (and any embedded logo image) to settle before printing,
  // otherwise the browser's print dialog can hang the page while decoding.
  if (win.document.readyState === "complete") {
    setTimeout(triggerPrint, 200);
  } else {
    win.addEventListener("load", () => setTimeout(triggerPrint, 200));
  }

  win.addEventListener("afterprint", () => win.close());
}

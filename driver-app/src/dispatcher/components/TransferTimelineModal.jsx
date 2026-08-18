import { useEffect, useState } from "react";
import apiClient from "../../services/apiClient";

const EVENT_LABELS = {
  driver_assigned: "Sürücü Atandı",
  driver_unassigned: "Sürücü Ataması Kaldırıldı",
  accepted: "Transfer Kabul Edildi",
  on_the_way: "Yola Çıkıldı",
  arrived: "Alış Noktasına Varıldı",
  passenger_called: "Yolcu Arandı",
  passenger_call_attempted: "Yolcu Arama Denemesi",
  passenger_whatsapp_opened: "Yolcu için WhatsApp Açıldı",
  passenger_on_board: "Yolcu Araca Alındı",
  trip_started: "Yolculuk Başladı",
  completed: "Transfer Tamamlandı",
  no_show_evidence_uploaded: "No Show Kanıtı Yüklendi",
  no_show: "No Show",
  cancelled: "Transfer İptal Edildi",
};

export default function TransferTimelineModal({ transfer, onClose }) {
  const [evidences, setEvidences] = useState([]);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceError, setEvidenceError] = useState("");

  useEffect(() => {
    if (!transfer?.id) return undefined;
    const controller = new AbortController();
    setEvidenceLoading(true);
    setEvidenceError("");
    apiClient.get(`/transfers/${transfer.id}/evidences`, { signal: controller.signal })
      .then((response) => setEvidences(Array.isArray(response.data?.data) ? response.data.data : []))
      .catch((error) => {
        if (error?.code !== "ERR_CANCELED") {
          setEvidenceError(error?.response?.data?.message || "Kanıtlar yüklenemedi.");
        }
      })
      .finally(() => setEvidenceLoading(false));
    return () => controller.abort();
  }, [transfer?.id]);

  if (!transfer) return null;

  const events = Array.isArray(transfer.events)
    ? [...transfer.events].sort((a, b) => new Date(a?.occurred_at || a?.created_at || 0) - new Date(b?.occurred_at || b?.created_at || 0))
    : [];
  const reference = transfer.voucher || transfer.booking_reference || `#${transfer.id}`;

  return (
    <div className="dispatcher-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="dispatcher-modal timeline-modal" role="dialog" aria-modal="true">
        <div className="timeline-modal-header">
          <div><span className="timeline-eyebrow">TRANSFER HISTORY</span><h2>Operasyon Zaman Çizelgesi</h2><p>{transfer.passenger_name || "Yolcu bilgisi yok"} · {reference}</p></div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              className="dispatcher-action-button"
              disabled={evidenceLoading || evidences.length === 0}
              onClick={() => openEvidenceReport(transfer, evidences, events)}
            >
              📄 PDF Raporu
            </button>
            <button type="button" className="dispatcher-modal-close" onClick={onClose}>×</button>
          </div>
        </div>
        <div className="timeline-modal-body">
          {events.length === 0 ? <div className="timeline-empty-state"><strong>Henüz operasyon kaydı yok.</strong></div> : (
            <ol className="transfer-timeline">
              {events.map((event, index) => {
                const metadata = event?.metadata && typeof event.metadata === "object" ? event.metadata : {};
                const eventTime = event.occurred_at || event.created_at;
                return (
                  <li className="transfer-timeline-item" key={event.id || `${event.event_type}-${index}`}>
                    <div className="timeline-marker"><span /></div>
                    <article className="timeline-event-card">
                      <div className="timeline-event-topline"><strong>{getEventLabel(event.event_type || event.status)}</strong><time>{formatDateTime(eventTime)}</time></div>
                      {(event?.driver?.name || event?.driver_name) && <p className="timeline-driver">Sürücü: <strong>{event?.driver?.name || event.driver_name}</strong></p>}
                      {(metadata.previous_status || metadata.new_status) && <div className="timeline-status-change"><span>{metadata.previous_status || "—"}</span><b>→</b><span>{metadata.new_status || event.status || "—"}</span></div>}
                      {event.note && <p className="timeline-note">{event.note}</p>}
                      {hasCoordinates(event) && (
                        <a
                          href={getEventMapUrl(event)}
                          target="_blank"
                          rel="noreferrer"
                          className="dispatcher-action-button"
                          style={{ marginTop: "10px", textDecoration: "none" }}
                        >
                          📍 İşlem Konumunu Aç
                        </a>
                      )}
                    </article>
                  </li>
                );
              })}
            </ol>
          )}

          <h3 style={{ margin: "28px 0 14px", color: "#0f172a" }}>Operasyon Kanıtları</h3>
          {evidenceLoading && <p>Kanıtlar yükleniyor...</p>}
          {evidenceError && <div className="dispatcher-error-state"><p>{evidenceError}</p></div>}
          {!evidenceLoading && !evidenceError && evidences.length === 0 && <div className="timeline-empty-state"><strong>Bu transfer için kanıt bulunmuyor.</strong></div>}
          <div style={{ display: "grid", gap: "16px" }}>
            {evidences.map((evidence) => <EvidenceCard key={evidence.id} evidence={evidence} />)}
          </div>
        </div>
      </section>
    </div>
  );
}

function EvidenceCard({ evidence }) {
  const mapUrl = `https://www.google.com/maps?q=${evidence.latitude},${evidence.longitude}`;
  return (
    <article style={{ border: "1px solid #fecaca", borderRadius: "18px", padding: "16px", background: "#fff7f7" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}><strong style={{ color: "#991b1b" }}>No Show Kanıtı</strong><time>{formatDateTime(evidence.recorded_at)}</time></div>
      {evidence.file_url && <a href={evidence.file_url} target="_blank" rel="noreferrer"><img src={evidence.file_url} alt="No Show kanıtı" style={{ width: "100%", maxHeight: "280px", objectFit: "cover", borderRadius: "14px" }} /></a>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px", marginTop: "14px" }}>
        <Info label="Sürücü" value={evidence.driver?.name || "-"} />
        <Info label="Bekleme" value={`${evidence.wait_minutes ?? "-"} dakika`} />
        <Info label="Arama Denemesi" value={evidence.call_attempts ?? "-"} />
        <Info label="WhatsApp" value={evidence.whatsapp_attempted ? "Gönderildi" : "Gönderilmedi"} />
        <Info label="İletişim Sonucu" value={contactLabel(evidence.contact_result)} />
        <Info label="GPS Hassasiyeti" value={`±${Math.round(Number(evidence.accuracy || 0))} metre`} />
      </div>
      {evidence.note && <p className="timeline-note">{evidence.note}</p>}
      <a href={mapUrl} target="_blank" rel="noreferrer" className="dispatcher-action-button" style={{ marginTop: "12px", textDecoration: "none" }}>📍 Konumu Haritada Aç</a>
    </article>
  );
}

function Info({ label, value }) { return <div style={{ padding: "10px", background: "#fff", borderRadius: "10px" }}><small style={{ display: "block", color: "#64748b" }}>{label}</small><strong>{value}</strong></div>; }
function getEventLabel(type) { return EVENT_LABELS[type] || type?.replaceAll("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Operasyon Kaydı"; }
function formatDateTime(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Tarih bilgisi yok" : new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(date); }
function contactLabel(value) { return { unreachable: "Ulaşılamadı", phone_off: "Telefon kapalı", wrong_number: "Numara hatalı", answered_needs_time: "Cevap verdi, süre istedi", other: "Diğer" }[value] || "-"; }

function openEvidenceReport(transfer, evidences, events) {
  const reportWindow = window.open("", "_blank");
  if (!reportWindow) {
    window.alert("Rapor penceresi açılamadı. Tarayıcı açılır pencere iznini kontrol edin.");
    return;
  }

  const reference = transfer.voucher || transfer.booking_reference || `#${transfer.id}`;
  const eventRows = events.map((event) => `
    <tr>
      <td>${escapeHtml(getEventLabel(event.event_type || event.status))}</td>
      <td>${escapeHtml(formatDateTime(event.occurred_at || event.created_at))}</td>
      <td>${escapeHtml(event?.driver?.name || event?.driver_name || "-")}</td>
      <td>${escapeHtml(event.note || "-")}</td>
      <td>${hasCoordinates(event) ? `<a href="${escapeAttribute(getEventMapUrl(event))}">${escapeHtml(`${event.latitude}, ${event.longitude}`)}</a>` : "-"}</td>
    </tr>`).join("");

  const evidenceBlocks = evidences.map((evidence, index) => {
    const mapUrl = `https://www.google.com/maps?q=${evidence.latitude},${evidence.longitude}`;
    return `
      <section class="evidence">
        <h2>Evidence ${index + 1} — No Show</h2>
        ${evidence.file_url ? `<img src="${escapeAttribute(evidence.file_url)}" alt="No Show evidence">` : ""}
        <div class="grid">
          ${reportField("Driver", evidence.driver?.name || "-")}
          ${reportField("Recorded at", formatDateTime(evidence.recorded_at))}
          ${reportField("Waiting time", `${evidence.wait_minutes ?? "-"} minutes`)}
          ${reportField("Call attempts", evidence.call_attempts ?? "-")}
          ${reportField("Passenger called", evidence.passenger_called ? "Yes" : "No")}
          ${reportField("WhatsApp attempted", evidence.whatsapp_attempted ? "Yes" : "No")}
          ${reportField("Contact result", contactLabel(evidence.contact_result))}
          ${reportField("GPS accuracy", `±${Math.round(Number(evidence.accuracy || 0))} metres`)}
          ${reportField("Latitude", evidence.latitude ?? "-")}
          ${reportField("Longitude", evidence.longitude ?? "-")}
        </div>
        <p><strong>Driver note:</strong> ${escapeHtml(evidence.note || "-")}</p>
        <p><a href="${escapeAttribute(mapUrl)}">Open GPS location in Google Maps</a></p>
      </section>`;
  }).join("");

  reportWindow.document.write(`<!doctype html>
  <html><head><meta charset="utf-8"><title>No Show Evidence Report - ${escapeHtml(reference)}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, sans-serif; color: #172033; font-size: 12px; line-height: 1.45; }
    header { border-bottom: 4px solid #2563eb; padding-bottom: 14px; margin-bottom: 18px; }
    header h1 { margin: 0; font-size: 25px; color: #0f172a; }
    header p { margin: 5px 0 0; color: #52647f; }
    .summary, .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .field { padding: 9px 11px; border: 1px solid #dbe3ef; border-radius: 8px; background: #f8fafc; }
    .field small { display: block; color: #64748b; margin-bottom: 3px; }
    h2 { margin: 22px 0 10px; color: #0f172a; font-size: 17px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; border: 1px solid #dbe3ef; text-align: left; vertical-align: top; }
    th { background: #eff6ff; color: #1e3a8a; }
    .evidence { page-break-inside: avoid; margin-top: 20px; padding: 14px; border: 1px solid #fecaca; border-radius: 10px; }
    .evidence img { width: 100%; max-height: 360px; object-fit: contain; margin: 8px 0 12px; border-radius: 8px; }
    footer { margin-top: 22px; padding-top: 10px; border-top: 1px solid #cbd5e1; color: #64748b; font-size: 10px; }
    .print-note { margin: 0 0 14px; padding: 9px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; }
    @media print { .print-note { display: none; } a { color: #000; text-decoration: none; } }
  </style></head><body>
    <p class="print-note">Print penceresinde hedef olarak “PDF olarak kaydet” seçin.</p>
    <header><h1>SKYFLEET AI — No Show Evidence Report</h1><p>Generated: ${escapeHtml(formatDateTime(new Date().toISOString()))}</p></header>
    <div class="summary">
      ${reportField("Booking reference", reference)}
      ${reportField("Passenger", transfer.passenger_name || transfer.passenger || "-")}
      ${reportField("Flight", transfer.flight_number || transfer.flight || "-")}
      ${reportField("Pickup time", transfer.pickup_time ? formatDateTime(transfer.pickup_time) : transfer.pickupTime || "-")}
      ${reportField("Pickup", transfer.pickup || "-")}
      ${reportField("Drop-off", transfer.dropoff || "-")}
      ${reportField("Driver", transfer.driver?.name || transfer.driver || "-")}
      ${reportField("Status", transfer.status || "-")}
    </div>
    <h2>Operation Timeline</h2>
    <table><thead><tr><th>Event</th><th>Time</th><th>Driver</th><th>Note</th><th>GPS</th></tr></thead><tbody>${eventRows || '<tr><td colspan="5">No events</td></tr>'}</tbody></table>
    ${evidenceBlocks}
    <footer>This report was generated from Skyfleet AI operational records. Times, GPS coordinates and evidence details reflect stored system data.</footer>
  </body></html>`);
  reportWindow.document.close();
  reportWindow.focus();
  window.setTimeout(() => reportWindow.print(), 1500);
}

function reportField(label, value) {
  return `<div class="field"><small>${escapeHtml(label)}</small><strong>${escapeHtml(String(value ?? "-"))}</strong></div>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function hasCoordinates(event) {
  return Number.isFinite(Number(event?.latitude)) && Number.isFinite(Number(event?.longitude));
}

function getEventMapUrl(event) {
  return `https://www.google.com/maps?q=${Number(event.latitude)},${Number(event.longitude)}`;
}
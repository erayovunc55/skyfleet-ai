import {
  useEffect,
  useMemo,
  useState,
} from "react";

import DriverGpsPanel from "../components/DriverGpsPanel";
import NoShowEvidencePanel from "../components/NoShowEvidencePanel";
import transferService from "../services/transferService";

const STATUS_FLOW = [
  { current: "pending", next: "accepted", label: "Transferi Kabul Et", icon: "✓" },
  { current: "accepted", next: "on_the_way", label: "Yola Çık", icon: "🚐" },
  { current: "on_the_way", next: "arrived", label: "Alış Noktasındayım", icon: "📍" },
  { current: "arrived", next: "passenger_called", label: "Yolcuyu Aradım", icon: "☎" },
  { current: "passenger_called", next: "passenger_on_board", label: "Yolcu Geldi", icon: "👤" },
  { current: "passenger_on_board", next: "trip_started", label: "Yolculuğu Başlat", icon: "▶" },
  { current: "trip_started", next: "completed", label: "Transferi Tamamla", icon: "🏁" },
];

const GPS_ACTIVE_STATUSES = [
  "accepted",
  "on_the_way",
  "arrived",
  "passenger_called",
  "passenger_on_board",
  "trip_started",
];

const NO_SHOW_ALLOWED_STATUSES = ["arrived", "passenger_called"];
const TRACKING_SHARE_STATUSES = [
  "on_the_way",
  "arrived",
  "passenger_called",
  "passenger_on_board",
  "trip_started",
  "completed",
  "no_show",
];

export default function DriverTransferDetailPage({ user, initialTransfer, onBack, onTransferUpdated }) {
  const [transfer, setTransfer] = useState(initialTransfer);
  const [showNoShowEvidence, setShowNoShowEvidence] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [trackingUrl, setTrackingUrl] = useState(initialTransfer?.tracking_url || "");
  const [trackingLoading, setTrackingLoading] = useState(false);

  const shouldEnableGps = Boolean(
    transfer?.id && GPS_ACTIVE_STATUSES.includes(transfer.status),
  );

  const canShareTracking = TRACKING_SHARE_STATUSES.includes(transfer.status);

  useEffect(() => {
    if (!canShareTracking) {
      setTrackingUrl("");
      return;
    }
    if (transfer?.tracking_url && transfer.tracking_url !== trackingUrl) {
      setTrackingUrl(transfer.tracking_url);
      return;
    }
    if (trackingUrl) return;

    let active = true;
    async function loadTrackingLink() {
      setTrackingLoading(true);
      try {
        const data = await transferService.getTrackingLink(transfer.id);
        if (active) setTrackingUrl(data?.tracking_url || "");
      } catch (requestError) {
        if (active && ![409, 410].includes(requestError?.response?.status)) {
          setError(requestError?.response?.data?.message || "Takip bağlantısı alınamadı.");
        }
      } finally {
        if (active) setTrackingLoading(false);
      }
    }
    loadTrackingLink();
    return () => { active = false; };
  }, [canShareTracking, transfer.id, transfer?.tracking_url, trackingUrl]);

  const nextAction = useMemo(
    () => STATUS_FLOW.find((item) => item.current === transfer.status) || null,
    [transfer.status],
  );
  const canCreateNoShowEvidence = NO_SHOW_ALLOWED_STATUSES.includes(transfer.status);

  async function updateStatus(status, note = null) {
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await transferService.updateStatus(transfer.id, status, note);
      const updatedTransfer = response?.data || transfer;
      if (updatedTransfer?.tracking_url) setTrackingUrl(updatedTransfer.tracking_url);
      setTransfer(updatedTransfer);
      onTransferUpdated?.(updatedTransfer);
      setMessage(response?.message || "Transfer durumu güncellendi.");
      return updatedTransfer;
    } catch (requestError) {
      const validationErrors = requestError?.response?.data?.errors;
      const validationMessage = validationErrors ? Object.values(validationErrors).flat().find(Boolean) : null;
      setError(validationMessage || requestError?.response?.data?.message || requestError?.message || "İşlem tamamlanamadı.");
      return null;
    } finally { setSaving(false); }
  }

  async function callPassenger() {
    setError(""); setMessage("");
    const phone = normalizePhone(transfer.passenger_phone);
    if (!phone) { setError("Yolcu telefon bilgisi bulunmuyor."); return; }
    const location = await getContactLocation();
    try {
      const response = await transferService.recordContactEvent(transfer.id, "passenger_call_attempted", location, "Sürücü yolcu arama düğmesine bastı.");
      appendContactEvent(response?.data?.event);
    } catch { setError("Arama açıldı ancak iletişim kaydı oluşturulamadı."); }
    window.location.href = `tel:${phone}`;
  }

  async function openWhatsApp() {
    setError(""); setMessage("");
    const phone = normalizePhone(transfer.passenger_phone);
    if (!phone) { setError("Yolcu telefon bilgisi bulunmuyor."); return; }
    const whatsappMessage = createWhatsAppMessage(transfer);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(whatsappMessage)}`, "_blank", "noopener,noreferrer");
    const location = await getContactLocation();
    try {
      const response = await transferService.recordContactEvent(transfer.id, "passenger_whatsapp_opened", location, "Sürücü yolcu için WhatsApp görüşmesini açtı.");
      appendContactEvent(response?.data?.event);
    } catch { setError("WhatsApp açıldı ancak iletişim kaydı oluşturulamadı."); }
  }

  async function shareTrackingWithPassenger() {
    setError(""); setMessage("");
    const phone = normalizePhone(transfer.passenger_phone);
    if (!phone) { setError("Yolcu telefon bilgisi bulunmuyor."); return; }
    let resolvedTrackingUrl = trackingUrl;
    if (!resolvedTrackingUrl) {
      setTrackingLoading(true);
      try {
        const data = await transferService.getTrackingLink(transfer.id);
        resolvedTrackingUrl = data?.tracking_url || "";
        setTrackingUrl(resolvedTrackingUrl);
      } catch (requestError) {
        setError(requestError?.response?.data?.message || "Takip bağlantısı hazırlanamadı.");
        return;
      } finally { setTrackingLoading(false); }
    }
    if (!resolvedTrackingUrl) { setError("Takip bağlantısı bulunamadı."); return; }
    const whatsappMessage = createTrackingWhatsAppMessage(transfer, resolvedTrackingUrl);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(whatsappMessage)}`, "_blank", "noopener,noreferrer");
    setMessage("Yolcu takip mesajı WhatsApp'ta hazırlandı.");
    const location = await getContactLocation();
    try {
      const response = await transferService.recordContactEvent(transfer.id, "passenger_whatsapp_opened", location, "Canlı takip bağlantısı yolcu için WhatsApp'ta açıldı.");
      appendContactEvent(response?.data?.event);
    } catch { setMessage("Takip mesajı WhatsApp'ta açıldı; iletişim kaydı oluşturulamadı."); }
  }

  async function copyTrackingLink() {
    setError(""); setMessage("");
    if (!trackingUrl) { setError("Takip bağlantısı henüz hazır değil."); return; }
    try { await navigator.clipboard.writeText(trackingUrl); setMessage("Takip bağlantısı kopyalandı."); }
    catch { setError("Bağlantı kopyalanamadı."); }
  }

  function appendContactEvent(event) {
    if (!event) return;
    const updatedTransfer = { ...transfer, events: [...(Array.isArray(transfer.events) ? transfer.events : []), event] };
    setTransfer(updatedTransfer); onTransferUpdated?.(updatedTransfer);
  }

  function openNavigation(type) {
    setError(""); setMessage("");
    const destination = type === "pickup"
      ? getLocationDestination(transfer.pickup_location, transfer.pickup_lat, transfer.pickup_lng, transfer.pickup)
      : getLocationDestination(transfer.dropoff_location, transfer.dropoff_lat, transfer.dropoff_lng, transfer.dropoff);
    if (!destination) { setError("Navigasyon için konum bilgisi bulunmuyor."); return; }
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`, "_blank", "noopener,noreferrer");
  }

  function openNoShowEvidence() { setError(""); setMessage(""); setShowNoShowEvidence(true); }
  async function handleEvidenceSaved() {
    setShowNoShowEvidence(false);
    await updateStatus("no_show", "No Show fotoğraf kanıtı yüklenerek sürücü tarafından kaydedildi.");
  }
  function handlePrimaryAction() { if (nextAction && !saving) updateStatus(nextAction.next); }

  return (
    <main className="driver-detail-page">
      <header className="driver-detail-header">
        <button type="button" onClick={onBack} aria-label="Transfer listesine dön">←</button>
        <div><small>{transfer.booking_reference || `TRANSFER #${transfer.id}`}</small><h1>Transfer Detayı</h1></div>
        <StatusPill status={transfer.status} />
      </header>

      <section className="driver-route-card">
        <RoutePoint tone="pickup" label="Alış" value={getPickupLabel(transfer)} secondary={transfer.pickup_point?.name || transfer.meet_point} />
        <div className="driver-route-line" />
        <RoutePoint tone="dropoff" label="Bırakış" value={getDropoffLabel(transfer)} secondary={transfer.dropoff_point?.name} />
        <div className="driver-route-actions">
          <button type="button" onClick={() => openNavigation("pickup")}>📍 Pickup’a Git</button>
          <button type="button" onClick={() => openNavigation("dropoff")}>🏁 Dropoff’a Git</button>
        </div>
      </section>

      <section className="driver-detail-grid">
        <InfoCard title="Yolcu">
          <InfoRow label="Ad Soyad" value={transfer.passenger_name || "Belirtilmedi"} />
          <InfoRow label="Telefon" value={transfer.passenger_phone || "Belirtilmedi"} />
          <InfoRow label="Yolcu" value={`${getPassengerCount(transfer)} kişi`} />
          <InfoRow label="Bagaj" value={`${Number(transfer.luggage_count || 0)} adet`} />
          <div className="driver-contact-actions">
            <button type="button" onClick={callPassenger}>☎ Yolcuyu Ara</button>
            <button type="button" onClick={openWhatsApp}>💬 WhatsApp</button>
          </div>
        </InfoCard>

        <InfoCard title="Uçuş">
          <InfoRow label="Uçuş" value={transfer.flight_number || "Belirtilmedi"} />
          <InfoRow label="Havayolu" value={transfer.airline || "Belirtilmedi"} />
          <InfoRow label="Terminal" value={transfer.terminal || "Belirtilmedi"} />
          <InfoRow label="Alış Zamanı" value={formatDateTime(transfer.pickup_time)} />
        </InfoCard>
      </section>

      <DriverGpsPanel transferId={transfer.id} enabled={shouldEnableGps} sendInterval={5000} />

      {canShareTracking && (
        <section className="driver-tracking-share-card">
          <div><span>YOLCU CANLI TAKİBİ</span><h2>Takip Bağlantısı</h2><p>Yolcu uygulama yüklemeden aracınızı canlı takip edebilir.</p></div>
          <div className="driver-tracking-share-actions">
            <button type="button" disabled={trackingLoading} onClick={shareTrackingWithPassenger}>{trackingLoading ? "Hazırlanıyor..." : "💬 WhatsApp ile Gönder"}</button>
            <button type="button" disabled={!trackingUrl} onClick={copyTrackingLink}>🔗 Linki Kopyala</button>
          </div>
        </section>
      )}

      {error && <div className="driver-action-message error">{error}</div>}
      {message && <div className="driver-action-message success">{message}</div>}

      {nextAction && (
        <section className="driver-primary-action-card">
          <button type="button" disabled={saving} onClick={handlePrimaryAction}>{nextAction.icon} {saving ? "Kaydediliyor..." : nextAction.label}</button>
        </section>
      )}

      {canCreateNoShowEvidence && (
        <section className="driver-no-show-card"><button type="button" disabled={saving} onClick={openNoShowEvidence}>⚠ No Show Kaydet</button></section>
      )}

      {showNoShowEvidence && (
        <NoShowEvidencePanel transfer={transfer} onSaved={handleEvidenceSaved} onCancel={() => setShowNoShowEvidence(false)} />
      )}
    </main>
  );
}

function StatusPill({ status }) { return <span className={`driver-status-pill status-${status}`}>{statusLabel(status)}</span>; }
function RoutePoint({ tone, label, value, secondary }) { return <div className={`driver-route-point ${tone}`}><span>{label}</span><strong>{value}</strong>{secondary && <small>{secondary}</small>}</div>; }
function InfoCard({ title, children }) { return <article className="driver-info-card"><h2>{title}</h2>{children}</article>; }
function InfoRow({ label, value }) { return <div className="driver-info-row"><span>{label}</span><strong>{value}</strong></div>; }
function normalizePhone(value) { if (!value) return ""; let phone = String(value).replace(/\D/g, ""); if (phone.startsWith("00")) phone = phone.slice(2); if (phone.length === 10 && phone.startsWith("5")) phone = `90${phone}`; if (phone.length === 11 && phone.startsWith("0")) phone = `90${phone.slice(1)}`; return phone; }
function getPassengerCount(transfer) { return Number(transfer.adult || 0) + Number(transfer.child || 0) + Number(transfer.baby || 0); }
function getPickupLabel(transfer) { return transfer.pickup_location?.name || transfer.pickup || "Belirtilmedi"; }
function getDropoffLabel(transfer) { return transfer.dropoff_location?.name || transfer.dropoff || "Belirtilmedi"; }
function getLocationDestination(location, lat, lng, fallback) { const latitude = Number(location?.latitude ?? lat); const longitude = Number(location?.longitude ?? lng); if (Number.isFinite(latitude) && Number.isFinite(longitude)) return `${latitude},${longitude}`; return location?.name || fallback || ""; }
function formatDateTime(value) { if (!value) return "Belirtilmedi"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }); }
function statusLabel(status) { const labels = { pending:"Bekliyor", accepted:"Kabul Edildi", on_the_way:"Yola Çıktı", arrived:"Alış Noktasında", passenger_called:"Yolcu Arandı", passenger_on_board:"Yolcu Araçta", trip_started:"Transfer Başladı", completed:"Tamamlandı", no_show:"No Show", cancelled:"İptal Edildi" }; return labels[status] || status; }
function createWhatsAppMessage(transfer) { return [`Merhaba ${transfer.passenger_name || ""},`, "", `SkyTrip Transfer sürücünüz ${transfer.driver?.name || ""}.`, `Rezervasyon: ${transfer.booking_reference || "-"}`, "", "Size ulaşmak için bu WhatsApp görüşmesini açtım."].join("\n"); }
function createTrackingWhatsAppMessage(transfer, trackingUrl) { return [`Merhaba ${transfer.passenger_name || ""},`, "", "Aracınız yola çıktı. Canlı konumu aşağıdaki bağlantıdan takip edebilirsiniz:", trackingUrl, "", `Rezervasyon: ${transfer.booking_reference || "-"}`].join("\n"); }
function getContactLocation() { return new Promise((resolve) => { if (!navigator.geolocation) { resolve({}); return; } navigator.geolocation.getCurrentPosition((position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }), () => resolve({}), { enableHighAccuracy: true, timeout: 5000, maximumAge: 15000 }); }); }

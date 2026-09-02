import { useState } from "react";
import { Button, Card } from "../../../components/ui";
import { useLanguage } from "../../../i18n";
import useTransfer from "../hooks/useTransfer";
import transferService from "../services/transferService";

const TEXT = {
  tr: { title: "Dispatcher İşlemleri", subtitle: "Hızlı operasyon araçları", callPassenger: "Yolcuyu Ara", callDriver: "Sürücüyü Ara", whatsapp: "Yolcu WhatsApp", whatsappLoading: "Mesaj hazırlanıyor...", tracking: "Yolcu Takip Linki", trackingLoading: "Takip linki alınıyor...", pickupMap: "Pickup Haritası", dropoffMap: "Dropoff Haritası", passengerPhone: "Yolcu telefonu", driverPhone: "Sürücü telefonu", noPhone: "Telefon bilgisi yok", noDriverPhone: "Sürücü telefonu yok" },
  en: { title: "Dispatcher Actions", subtitle: "Quick operation tools", callPassenger: "Call Passenger", callDriver: "Call Driver", whatsapp: "Passenger WhatsApp", whatsappLoading: "Preparing message...", tracking: "Passenger Tracking", trackingLoading: "Loading tracking link...", pickupMap: "Pickup Map", dropoffMap: "Dropoff Map", passengerPhone: "Passenger phone", driverPhone: "Driver phone", noPhone: "Phone not available", noDriverPhone: "Driver phone not available" },
  ar: { title: "إجراءات المرسل", subtitle: "أدوات تشغيل سريعة", callPassenger: "اتصل بالراكب", callDriver: "اتصل بالسائق", whatsapp: "واتساب الراكب", whatsappLoading: "جارٍ تجهيز الرسالة...", tracking: "رابط تتبع الراكب", trackingLoading: "جارٍ تحميل رابط التتبع...", pickupMap: "خريطة الاستلام", dropoffMap: "خريطة الوجهة", passengerPhone: "هاتف الراكب", driverPhone: "هاتف السائق", noPhone: "رقم الهاتف غير متاح", noDriverPhone: "هاتف السائق غير متاح" },
  es: { title: "Acciones del dispatcher", subtitle: "Herramientas rápidas de operación", callPassenger: "Llamar al pasajero", callDriver: "Llamar al conductor", whatsapp: "WhatsApp del pasajero", whatsappLoading: "Preparando mensaje...", tracking: "Seguimiento del pasajero", trackingLoading: "Cargando enlace...", pickupMap: "Mapa de recogida", dropoffMap: "Mapa de destino", passengerPhone: "Teléfono del pasajero", driverPhone: "Teléfono del conductor", noPhone: "Teléfono no disponible", noDriverPhone: "Teléfono del conductor no disponible" },
};

export default function DispatcherActionsCard() {
  const { language } = useLanguage();
  const text = TEXT[language] || TEXT.en;
  const { selectedTransfer } = useTransfer();
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  if (!selectedTransfer) return null;

  const passengerPhone = normalizePhone(selectedTransfer.passenger_phone);
  const driverPhone = normalizePhone(selectedTransfer.driver?.phone);
  const pickupCoordinates = getCoordinates(selectedTransfer.pickup_location?.latitude ?? selectedTransfer.pickup_lat, selectedTransfer.pickup_location?.longitude ?? selectedTransfer.pickup_lng);
  const dropoffCoordinates = getCoordinates(selectedTransfer.dropoff_location?.latitude ?? selectedTransfer.dropoff_lat, selectedTransfer.dropoff_location?.longitude ?? selectedTransfer.dropoff_lng);
  const trackingCanExist = ["on_the_way", "arrived", "passenger_called", "passenger_on_board", "trip_started", "completed", "no_show"].includes(selectedTransfer.status);

  const callPassenger = () => { if (passengerPhone) window.location.href = `tel:${passengerPhone}`; };
  const callDriver = () => { if (driverPhone) window.location.href = `tel:${driverPhone}`; };

  const openPassengerWhatsApp = async () => {
    if (!passengerPhone) return;
    setWhatsappLoading(true);
    setTrackingError("");

    try {
      let trackingUrl = "";

      if (trackingCanExist && selectedTransfer.id) {
        try {
          const trackingData = await transferService.getTrackingLink(selectedTransfer.id);
          trackingUrl = trackingData?.tracking_url || "";
        } catch {
          trackingUrl = "";
        }
      }

      const message = createPassengerMessage(selectedTransfer, trackingUrl);
      window.open(`https://wa.me/${passengerPhone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    } finally {
      setWhatsappLoading(false);
    }
  };

  const openTracking = async () => {
    if (!selectedTransfer.id || !trackingCanExist) return;
    setTrackingLoading(true);
    setTrackingError("");
    try {
      const data = await transferService.getTrackingLink(selectedTransfer.id);
      if (!data?.tracking_url) throw new Error("Takip bağlantısı bulunamadı.");
      window.open(data.tracking_url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setTrackingError(error?.response?.data?.message || error?.message || "Takip bağlantısı alınamadı.");
    } finally {
      setTrackingLoading(false);
    }
  };

  const openPickupMap = () => openGoogleMaps({ coordinates: pickupCoordinates, fallbackAddress: selectedTransfer.pickup_location?.name || selectedTransfer.pickup });
  const openDropoffMap = () => openGoogleMaps({ coordinates: dropoffCoordinates, fallbackAddress: selectedTransfer.dropoff_location?.name || selectedTransfer.dropoff });

  return (
    <Card title={text.title} subtitle={text.subtitle}>
      <div className="dispatcher-actions-grid">
        <Button variant="secondary" disabled={!passengerPhone} onClick={callPassenger}>☎ {text.callPassenger}</Button>
        <Button variant="secondary" disabled={!driverPhone} onClick={callDriver}>☎ {text.callDriver}</Button>
        <Button variant="success" disabled={!passengerPhone || whatsappLoading} onClick={openPassengerWhatsApp}>💬 {whatsappLoading ? text.whatsappLoading : text.whatsapp}</Button>
        <Button variant="primary" disabled={!trackingCanExist || trackingLoading} onClick={openTracking}>🛰 {trackingLoading ? text.trackingLoading : text.tracking}</Button>
        <Button variant="ghost" disabled={!pickupCoordinates && !selectedTransfer.pickup} onClick={openPickupMap}>📍 {text.pickupMap}</Button>
        <Button variant="ghost" disabled={!dropoffCoordinates && !selectedTransfer.dropoff} onClick={openDropoffMap}>🏁 {text.dropoffMap}</Button>
      </div>
      {trackingError && <div className="transfer-supplier-message error">{trackingError}</div>}
      {!trackingCanExist && (
        <div className="transfer-supplier-info">Yolcu takip linki, sürücü “Yola Çıktım” dediğinde otomatik aktif olur.</div>
      )}
      <div className="dispatcher-action-contact-summary">
        <ContactRow label={text.passengerPhone} value={selectedTransfer.passenger_phone || text.noPhone} />
        <ContactRow label={text.driverPhone} value={selectedTransfer.driver?.phone || text.noDriverPhone} />
      </div>
    </Card>
  );
}

function ContactRow({ label, value }) { return <div className="dispatcher-contact-row"><span>{label}</span><strong>{value}</strong></div>; }
function normalizePhone(value) { if (!value) return ""; let phone = String(value).replace(/\D/g, ""); if (phone.startsWith("00")) phone = phone.slice(2); if (phone.length === 10 && phone.startsWith("5")) phone = `90${phone}`; if (phone.length === 11 && phone.startsWith("0")) phone = `90${phone.slice(1)}`; return phone; }
function getCoordinates(latitude, longitude) { const lat = Number(latitude); const lng = Number(longitude); return Number.isFinite(lat) && Number.isFinite(lng) ? { latitude: lat, longitude: lng } : null; }
function openGoogleMaps({ coordinates, fallbackAddress }) { const destination = coordinates ? `${coordinates.latitude},${coordinates.longitude}` : fallbackAddress; if (!destination) return; window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`, "_blank", "noopener,noreferrer"); }
function createPassengerMessage(transfer, trackingUrl = "") {
  const passengerName = transfer.passenger_name || "Değerli misafirimiz";
  const bookingReference = transfer.booking_reference || "-";
  const pickup = transfer.pickup_location?.name || transfer.pickup || "-";
  const driverName = transfer.driver?.name || "henüz atanmadı";
  const vehiclePlate = transfer.assigned_vehicle?.plate || transfer.driver?.vehicle?.plate || "-";
  const lines = [
    `Merhaba ${passengerName},`,
    "",
    `SkyTrip Transfer rezervasyonunuz: ${bookingReference}`,
    `Alış noktası: ${pickup}`,
    `Sürücü: ${driverName}`,
    `Araç plakası: ${vehiclePlate}`,
  ];

  if (trackingUrl) {
    lines.push("", "Aracınızı canlı takip edin:", trackingUrl);
  } else {
    lines.push("", "Operasyon ekibimiz transferinizi takip etmektedir.");
  }

  return lines.join("\n");
}

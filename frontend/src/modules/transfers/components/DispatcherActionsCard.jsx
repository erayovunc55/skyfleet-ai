import { useState } from "react";
import { Button, Card } from "../../../components/ui";
import { useLanguage } from "../../../i18n";
import useTransfer from "../hooks/useTransfer";
import transferService from "../services/transferService";

const TEXT = {
  tr: { title: "Dispatcher İşlemleri", subtitle: "Hızlı operasyon araçları", callPassenger: "Yolcuyu Ara", callDriver: "Sürücüyü Ara", whatsapp: "Voucher + Buluşma Talimatı", whatsappLoading: "Mesaj hazırlanıyor...", tracking: "Yolcu Takip Linki", trackingLoading: "Takip linki alınıyor...", pickupMap: "Pickup Haritası", dropoffMap: "Dropoff Haritası", passengerPhone: "Yolcu telefonu", driverPhone: "Sürücü telefonu", noPhone: "Telefon bilgisi yok", noDriverPhone: "Sürücü telefonu yok" },
  en: { title: "Dispatcher Actions", subtitle: "Quick operation tools", callPassenger: "Call Passenger", callDriver: "Call Driver", whatsapp: "Voucher + Meeting Instructions", whatsappLoading: "Preparing message...", tracking: "Passenger Tracking", trackingLoading: "Loading tracking link...", pickupMap: "Pickup Map", dropoffMap: "Dropoff Map", passengerPhone: "Passenger phone", driverPhone: "Driver phone", noPhone: "Phone not available", noDriverPhone: "Driver phone not available" },
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
  const dropoff = transfer.dropoff_location?.name || transfer.dropoff || "-";
  const pickupTime = transfer.pickup_time ? new Date(transfer.pickup_time).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" }) : "-";
  const flight = transfer.flight_number || "-";
  const istPickup = isIstanbulAirportPickup(transfer);
  const airportDropoff = isIstanbulAirportDropoff(transfer);
  const lines = [
    istPickup || airportDropoff ? `Hello ${passengerName},` : `Merhaba ${passengerName},`,
    "",
    istPickup || airportDropoff ? `Your SkyTrip Transfer reservation: ${bookingReference}` : `SkyTrip Transfer rezervasyonunuz: ${bookingReference}`,
    istPickup || airportDropoff ? `Voucher / booking number: ${bookingReference}` : `Voucher / rezervasyon no: ${bookingReference}`,
    istPickup || airportDropoff ? `Pickup date and time: ${pickupTime}` : `Alış tarihi ve saati: ${pickupTime}`,
    istPickup || airportDropoff ? `Pickup: ${pickup}` : `Alış noktası: ${pickup}`,
    istPickup || airportDropoff ? `Drop-off: ${dropoff}` : `Varış noktası: ${dropoff}`,
    istPickup || airportDropoff ? `Flight number: ${flight}` : `Uçuş numarası: ${flight}`,
  ];

  if (istPickup) {
    lines.push(
      "",
      "*****Meeting Point*****",
      "Our greeter team is at gate 13. After take your luggage, please go gate 14. When you go outside, our meeting point is on your right. F84 is written on our board. Please go there and check your name.",
      "",
      "*****Waiting Time*****",
      "Every passenger has 75 minutes of waiting time. After your flight lands, you need to show up within 75 minutes.",
      "",
      "*****Passenger Name*****",
      "Please provide us with all passenger names. We need to enter them into the police system (UEDTS) for your safety. This is a legal obligation in Turkey.",
      "",
      "*****Amendment*****",
      "If you want to make an amendment, you need to contact the reservation website or travel agent. We cannot change your reservation.",
      "",
      "*****Delay*****",
      "If your flight is delayed, do not worry. We will wait for you until your flight lands.",
      "",
      "If you have any problem or question, you can text or call us. We will help you.",
      "",
      "*****Transfer Details - Please Check*****",
      `DATE: ${formatVoucherDate(transfer.pickup_time)}`,
      `HOUR: ${formatVoucherTime(transfer.pickup_time)}`,
      `FLIGHT CODE: ${flight}`,
      `REZ NO: ${bookingReference}`,
    );
  } else if (airportDropoff) {
    lines.push(
      "",
      "Dear Valued Guest,",
      "",
      "Welcome! Your scheduled departure transfer in Turkey is confirmed. The meeting point is at the hotel's front, and we request your readiness within 15 minutes of our vehicle's arrival.",
      "",
      "Contact us promptly for any discrepancies or further information. Your comfort and convenience are our utmost priorities.",
      "",
      "Please review your transfer details:",
      `DATE: ${formatVoucherDate(transfer.pickup_time)}`,
      `NAME: ${passengerName}`,
      `HOUR: ${formatVoucherTime(transfer.pickup_time)}`,
      `PICK-UP: ${pickup}`,
      `DROP-OFF: ${dropoff}`,
      `REZ NO: ${bookingReference}`,
      "",
      "Contact us promptly for any discrepancies or further information. Your comfort and convenience are our utmost priorities.",
      "",
      "Thank you for choosing us, and we look forward to providing your journey.",
    );
  } else {
    const meetingPoint = transfer.meet_point || transfer.pickup_point?.name || "Please follow the airport meeting instructions provided by our operations team.";
    lines.push("", "Meeting Instructions:", meetingPoint, `Transfer date: ${formatVoucherDate(transfer.pickup_time)}`, `Pickup time: ${formatVoucherTime(transfer.pickup_time)}`, `Booking reference: ${bookingReference}`);
  }

  if (trackingUrl) {
    lines.push("", istPickup || airportDropoff ? "Track your vehicle live:" : "Aracınızı canlı takip edin:", trackingUrl);
  } else {
    lines.push("", istPickup || airportDropoff ? "Our operations team is monitoring your transfer." : "Operasyon ekibimiz transferinizi takip etmektedir.");
  }

  return lines.join("\n");
}

function isIstanbulAirportPickup(transfer) {
  const iata = String(transfer.pickup_location?.airport?.iata_code || transfer.pickup_location?.code || "").toUpperCase();
  const pickup = String(transfer.pickup_location?.name || transfer.pickup || "").toLowerCase();
  return iata === "IST" || pickup.includes("istanbul airport") || pickup.includes("istanbul havalimanı") || pickup.includes("istanbul havalimani");
}

function isIstanbulAirportDropoff(transfer) {
  const iata = String(transfer.dropoff_location?.airport?.iata_code || transfer.dropoff_location?.code || "").toUpperCase();
  const dropoff = String(transfer.dropoff_location?.name || transfer.dropoff || "").toLowerCase();
  return iata === "IST" || iata === "SAW" || dropoff.includes("istanbul airport") || dropoff.includes("istanbul havalimanı") || dropoff.includes("istanbul havalimani") || dropoff.includes("new airport") || dropoff.includes("sabiha gökçen") || dropoff.includes("sabiha gokcen");
}

function formatVoucherDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatVoucherTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

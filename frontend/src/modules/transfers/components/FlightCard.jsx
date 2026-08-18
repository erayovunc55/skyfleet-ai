import { Card } from "../../../components/ui";
import { useLanguage } from "../../../i18n";
import useTransfer from "../hooks/useTransfer";

const TEXT = {
  tr: {
    title: "Uçuş",
    subtitle: "Uçuş ve karşılama bilgileri",
    flightNumber: "Uçuş Numarası",
    airline: "Havayolu",
    terminal: "Terminal",
    pickupTime: "Alış Saati",
    meetingPoint: "Buluşma Noktası",
    notProvided: "Belirtilmedi",
  },
  en: {
    title: "Flight",
    subtitle: "Flight and meet & greet information",
    flightNumber: "Flight Number",
    airline: "Airline",
    terminal: "Terminal",
    pickupTime: "Pickup Time",
    meetingPoint: "Meeting Point",
    notProvided: "Not Provided",
  },
  ar: {
    title: "الرحلة",
    subtitle: "معلومات الرحلة والاستقبال",
    flightNumber: "رقم الرحلة",
    airline: "شركة الطيران",
    terminal: "المبنى",
    pickupTime: "وقت الاستلام",
    meetingPoint: "نقطة الالتقاء",
    notProvided: "غير محدد",
  },
  es: {
    title: "Vuelo",
    subtitle: "Información del vuelo y recepción",
    flightNumber: "Número de vuelo",
    airline: "Aerolínea",
    terminal: "Terminal",
    pickupTime: "Hora de recogida",
    meetingPoint: "Punto de encuentro",
    notProvided: "No indicado",
  },
};

const LOCALES = {
  tr: "tr-TR",
  en: "en-GB",
  ar: "ar-SA",
  es: "es-ES",
};

export default function FlightCard() {
  const { selectedTransfer } = useTransfer();
  const { language } = useLanguage();
  const text = TEXT[language] || TEXT.en;
  const locale = LOCALES[language] || LOCALES.en;

  if (!selectedTransfer) {
    return null;
  }

  return (
    <Card title={text.title} subtitle={text.subtitle}>
      <div className="info-row">
        <span>{text.flightNumber}</span>
        <strong>{selectedTransfer.flight_number || text.notProvided}</strong>
      </div>

      <div className="info-row">
        <span>{text.airline}</span>
        <strong>{selectedTransfer.airline || text.notProvided}</strong>
      </div>

      <div className="info-row">
        <span>{text.terminal}</span>
        <strong>{selectedTransfer.terminal || text.notProvided}</strong>
      </div>

      <div className="info-row">
        <span>{text.pickupTime}</span>
        <strong>{formatDateTime(selectedTransfer.pickup_time, locale, text.notProvided)}</strong>
      </div>

      <div className="info-row">
        <span>{text.meetingPoint}</span>
        <strong>
          {selectedTransfer.pickup_point?.name ||
            selectedTransfer.meet_point ||
            text.notProvided}
        </strong>
      </div>
    </Card>
  );
}

function formatDateTime(value, locale, fallback) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

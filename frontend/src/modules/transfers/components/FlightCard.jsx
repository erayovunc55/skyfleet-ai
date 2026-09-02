import { useEffect, useState } from "react";
import { Card } from "../../../components/ui";
import { useLanguage } from "../../../i18n";
import useTransfer from "../hooks/useTransfer";
import transferService from "../services/transferService";

const TEXT = {
  tr: {
    title: "Uçuş",
    subtitle: "Canlı uçuş ve karşılama bilgileri",
    flightNumber: "Uçuş Numarası",
    airline: "Havayolu",
    status: "Durum",
    route: "Uçuş Rotası",
    scheduled: "Planlanan Varış",
    estimated: "Tahmini Varış",
    actual: "Gerçek Varış",
    difference: "Zaman Farkı",
    terminal: "Terminal",
    gate: "Kapı",
    pickupTime: "Transfer Alış Saati",
    meetingPoint: "Buluşma Noktası",
    lastUpdated: "Son Güncelleme",
    refresh: "Uçuşu Güncelle",
    refreshing: "Güncelleniyor...",
    notSynced: "Henüz uçuş verisi senkronize edilmedi.",
    trackingUnavailable: "Uçuş takip servisi yapılandırılmamış.",
    noFlight: "Bu transfer için uçuş numarası bulunmuyor.",
    notProvided: "Belirtilmedi",
    early: "erken",
    late: "gecikmeli",
    onTime: "zamanında",
  },
  en: {
    title: "Flight",
    subtitle: "Live flight and meet & greet information",
    flightNumber: "Flight Number",
    airline: "Airline",
    status: "Status",
    route: "Flight Route",
    scheduled: "Scheduled Arrival",
    estimated: "Estimated Arrival",
    actual: "Actual Arrival",
    difference: "Time Difference",
    terminal: "Terminal",
    gate: "Gate",
    pickupTime: "Transfer Pickup Time",
    meetingPoint: "Meeting Point",
    lastUpdated: "Last Updated",
    refresh: "Refresh Flight",
    refreshing: "Refreshing...",
    notSynced: "Flight data has not been synchronized yet.",
    trackingUnavailable: "Flight tracking service is not configured.",
    noFlight: "No flight number is available for this transfer.",
    notProvided: "Not Provided",
    early: "early",
    late: "late",
    onTime: "on time",
  },
  ar: {
    title: "الرحلة",
    subtitle: "معلومات الرحلة والاستقبال المباشرة",
    flightNumber: "رقم الرحلة",
    airline: "شركة الطيران",
    status: "الحالة",
    route: "مسار الرحلة",
    scheduled: "الوصول المجدول",
    estimated: "الوصول المتوقع",
    actual: "الوصول الفعلي",
    difference: "فرق الوقت",
    terminal: "المبنى",
    gate: "البوابة",
    pickupTime: "وقت الاستلام",
    meetingPoint: "نقطة الالتقاء",
    lastUpdated: "آخر تحديث",
    refresh: "تحديث الرحلة",
    refreshing: "جارٍ التحديث...",
    notSynced: "لم تتم مزامنة بيانات الرحلة بعد.",
    trackingUnavailable: "خدمة تتبع الرحلات غير مهيأة.",
    noFlight: "لا يوجد رقم رحلة لهذا النقل.",
    notProvided: "غير محدد",
    early: "مبكر",
    late: "متأخر",
    onTime: "في الموعد",
  },
  es: {
    title: "Vuelo",
    subtitle: "Información en vivo del vuelo y recepción",
    flightNumber: "Número de vuelo",
    airline: "Aerolínea",
    status: "Estado",
    route: "Ruta del vuelo",
    scheduled: "Llegada programada",
    estimated: "Llegada estimada",
    actual: "Llegada real",
    difference: "Diferencia horaria",
    terminal: "Terminal",
    gate: "Puerta",
    pickupTime: "Hora de recogida",
    meetingPoint: "Punto de encuentro",
    lastUpdated: "Última actualización",
    refresh: "Actualizar vuelo",
    refreshing: "Actualizando...",
    notSynced: "Los datos del vuelo aún no se han sincronizado.",
    trackingUnavailable: "El servicio de seguimiento no está configurado.",
    noFlight: "Este traslado no tiene número de vuelo.",
    notProvided: "No indicado",
    early: "antes",
    late: "con retraso",
    onTime: "a tiempo",
  },
};

const LOCALES = {
  tr: "tr-TR",
  en: "en-GB",
  ar: "ar-SA",
  es: "es-ES",
};

const STATUS_LABELS = {
  scheduled: "Scheduled",
  active: "In Flight",
  landed: "Landed",
  cancelled: "Cancelled",
  incident: "Incident",
  diverted: "Diverted",
};

export default function FlightCard() {
  const { selectedTransfer } = useTransfer();
  const { language } = useLanguage();
  const text = TEXT[language] || TEXT.en;
  const locale = LOCALES[language] || LOCALES.en;
  const [flightData, setFlightData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      if (!selectedTransfer?.id || !selectedTransfer?.flight_number) {
        setFlightData(null);
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await transferService.getFlightStatus(selectedTransfer.id);
        if (active) setFlightData(data);
      } catch (requestError) {
        if (active) {
          setError(
            requestError?.response?.data?.message ||
              requestError?.message ||
              "Flight status could not be loaded.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [selectedTransfer?.id, selectedTransfer?.flight_number]);

  if (!selectedTransfer) return null;

  async function handleSync() {
    if (!selectedTransfer?.id || !selectedTransfer?.flight_number) return;

    setSyncing(true);
    setError("");

    try {
      const snapshot = await transferService.syncFlightStatus(selectedTransfer.id);
      setFlightData((current) => ({
        ...(current || {}),
        transfer_id: selectedTransfer.id,
        booking_reference: selectedTransfer.booking_reference,
        flight_number: selectedTransfer.flight_number,
        configured: true,
        latest: snapshot,
      }));
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Flight status could not be refreshed.",
      );
    } finally {
      setSyncing(false);
    }
  }

  const latest = flightData?.latest || null;
  const hasFlight = Boolean(selectedTransfer.flight_number);
  const configured = flightData?.configured !== false;

  return (
    <Card title={text.title} subtitle={text.subtitle}>
      <div className="info-row">
        <span>{text.flightNumber}</span>
        <strong>{selectedTransfer.flight_number || text.notProvided}</strong>
      </div>

      {!hasFlight ? (
        <div className="flight-tracking-state">{text.noFlight}</div>
      ) : loading ? (
        <div className="flight-tracking-state">{text.refreshing}</div>
      ) : (
        <>
          {latest ? (
            <>
              <div className="info-row">
                <span>{text.status}</span>
                <strong>{STATUS_LABELS[latest.status] || latest.status || text.notProvided}</strong>
              </div>

              <div className="info-row">
                <span>{text.airline}</span>
                <strong>{latest.airline_name || selectedTransfer.airline || text.notProvided}</strong>
              </div>

              <div className="info-row">
                <span>{text.route}</span>
                <strong>
                  {[latest.departure_iata, latest.arrival_iata].filter(Boolean).join(" → ") ||
                    text.notProvided}
                </strong>
              </div>

              <div className="info-row">
                <span>{text.scheduled}</span>
                <strong>{formatDateTime(latest.scheduled_arrival_at, locale, text.notProvided)}</strong>
              </div>

              <div className="info-row">
                <span>{text.estimated}</span>
                <strong>{formatDateTime(latest.estimated_arrival_at, locale, text.notProvided)}</strong>
              </div>

              <div className="info-row">
                <span>{text.actual}</span>
                <strong>{formatDateTime(latest.actual_arrival_at, locale, text.notProvided)}</strong>
              </div>

              <div className="info-row">
                <span>{text.difference}</span>
                <strong>{formatDelay(latest.delay_minutes, text)}</strong>
              </div>

              <div className="info-row">
                <span>{text.terminal}</span>
                <strong>{latest.arrival_terminal || selectedTransfer.terminal || text.notProvided}</strong>
              </div>

              <div className="info-row">
                <span>{text.gate}</span>
                <strong>{latest.arrival_gate || text.notProvided}</strong>
              </div>

              <div className="info-row">
                <span>{text.lastUpdated}</span>
                <strong>{formatDateTime(latest.recorded_at, locale, text.notProvided)}</strong>
              </div>
            </>
          ) : (
            <div className="flight-tracking-state">
              {configured ? text.notSynced : text.trackingUnavailable}
            </div>
          )}

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

          {error && <div className="flight-tracking-state error">{error}</div>}

          <button
            type="button"
            className="supplier-secondary-button"
            disabled={syncing || !configured}
            onClick={handleSync}
          >
            {syncing ? text.refreshing : text.refresh}
          </button>
        </>
      )}
    </Card>
  );
}

function formatDelay(value, text) {
  if (value === null || value === undefined || value === "") return text.notProvided;
  const minutes = Number(value);
  if (!Number.isFinite(minutes)) return text.notProvided;
  if (minutes === 0) return text.onTime;
  return minutes < 0
    ? `${Math.abs(minutes)} dk ${text.early}`
    : `${minutes} dk ${text.late}`;
}

function formatDateTime(value, locale, fallback) {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
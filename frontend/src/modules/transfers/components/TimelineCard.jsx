import { Card, StatusBadge } from "../../../components/ui";
import { useLanguage } from "../../../i18n";
import useTransfer from "../hooks/useTransfer";

const TEXT = {
  tr: { title: "Operasyon Zaman Çizelgesi", event: "olay kaydı", empty: "Henüz operasyon kaydı bulunmuyor.", actor: "İşlemi yapan sürücü:", noTime: "Zaman bilgisi yok", unknown: "Operasyon Kaydı" },
  en: { title: "Operation Timeline", event: "events", empty: "No operation records yet.", actor: "Driver who performed the action:", noTime: "No time information", unknown: "Operation Record" },
  ar: { title: "الخط الزمني للعملية", event: "أحداث", empty: "لا توجد سجلات تشغيل حتى الآن.", actor: "السائق الذي نفذ الإجراء:", noTime: "لا توجد معلومات زمنية", unknown: "سجل العملية" },
  es: { title: "Cronología de la operación", event: "eventos", empty: "Aún no hay registros de operación.", actor: "Conductor que realizó la acción:", noTime: "Sin información de hora", unknown: "Registro de operación" },
};

const LABELS = {
  pending: { tr: "Transfer Beklemede", en: "Transfer Waiting", ar: "التحويل قيد الانتظار", es: "Traslado pendiente" },
  driver_assigned: { tr: "Sürücü Atandı", en: "Driver Assigned", ar: "تم تعيين السائق", es: "Conductor asignado" },
  driver_unassigned: { tr: "Sürücü Ataması Kaldırıldı", en: "Driver Unassigned", ar: "تم إلغاء تعيين السائق", es: "Conductor desasignado" },
  accepted: { tr: "Transfer Kabul Edildi", en: "Transfer Accepted", ar: "تم قبول التحويل", es: "Traslado aceptado" },
  on_the_way: { tr: "Sürücü Yola Çıktı", en: "Driver Started Driving", ar: "انطلق السائق", es: "El conductor inició el trayecto" },
  arrived: { tr: "Sürücü Alış Noktasına Ulaştı", en: "Driver Arrived at Pickup", ar: "وصل السائق إلى نقطة الاستلام", es: "El conductor llegó a la recogida" },
  passenger_called: { tr: "Yolcu Arandı", en: "Passenger Contacted", ar: "تم التواصل مع الراكب", es: "Pasajero contactado" },
  passenger_on_board: { tr: "Yolcu Geldi", en: "Passenger On Board", ar: "الراكب في المركبة", es: "Pasajero a bordo" },
  trip_started: { tr: "Yolculuk Başladı", en: "Trip Started", ar: "بدأت الرحلة", es: "Viaje iniciado" },
  completed: { tr: "Yolculuk Tamamlandı", en: "Trip Completed", ar: "اكتملت الرحلة", es: "Viaje completado" },
  no_show: { tr: "Yolcu Gelmedi — No Show", en: "Passenger No Show", ar: "عدم حضور الراكب", es: "Pasajero no presentado" },
  cancelled: { tr: "Transfer İptal Edildi", en: "Transfer Cancelled", ar: "تم إلغاء التحويل", es: "Traslado cancelado" },
  transfer_updated: { tr: "Transfer Güncellendi", en: "Transfer Updated", ar: "تم تحديث التحويل", es: "Traslado actualizado" },
  supplier_assigned: { tr: "Tedarikçi Atandı", en: "Supplier Assigned", ar: "تم تعيين المورد", es: "Proveedor asignado" },
};

const NOTE_TRANSLATIONS = {
  "Transfer tedarikçiye atandı.": { tr: "Transfer tedarikçiye atandı.", en: "Transfer assigned to supplier.", ar: "تم تعيين التحويل للمورد.", es: "Traslado asignado al proveedor." },
  "Transfer bilgileri dispatcher tarafından güncellendi.": { tr: "Transfer bilgileri dispatcher tarafından güncellendi.", en: "Transfer information was updated by the dispatcher.", ar: "تم تحديث معلومات التحويل بواسطة المرسل.", es: "La información del traslado fue actualizada por el dispatcher." },
};

const LOCALES = { tr: "tr-TR", en: "en-GB", ar: "ar-SA", es: "es-ES" };

export default function TimelineCard() {
  const { selectedTransfer } = useTransfer();
  const { language } = useLanguage();
  const text = TEXT[language] || TEXT.en;
  if (!selectedTransfer) return null;
  const events = normalizeEvents(selectedTransfer.events);

  return (
    <Card className="timeline-card" title={text.title} subtitle={`${events.length} ${text.event}`}>
      {events.length === 0 ? <div className="timeline-empty">{text.empty}</div> : (
        <div className="timeline">
          {events.map((event, index) => <TimelineItem key={event.id || `${event.event_type}-${event.occurred_at}-${index}`} event={event} language={language} text={text} isLast={index === events.length - 1} />)}
        </div>
      )}
    </Card>
  );
}

function TimelineItem({ event, language, text, isLast }) {
  const type = event.event_type || event.status || "unknown";
  return (
    <article className="timeline-item">
      {!isLast && <div className="timeline-line" />}
      <div className={`timeline-dot timeline-dot-${getEventTone(type)}`} />
      <div className="timeline-content">
        <div className="timeline-content-header">
          <div><strong>{getEventLabel(type, language, text)}</strong><small>{formatDateTime(event.occurred_at || event.created_at, language, text.noTime)}</small></div>
          <StatusBadge status={event.status || type} label={getEventLabel(type, language, text)} tone={getEventTone(type)} />
        </div>
        {event.driver?.name && <p className="timeline-actor">{text.actor} <strong>{event.driver.name}</strong></p>}
        {event.note && <p className="timeline-note">{translateEventNote(event.note, language)}</p>}
        {(event.latitude || event.longitude) && <div className="timeline-location"><span>📍</span><span>{event.latitude}, {event.longitude}</span></div>}
      </div>
    </article>
  );
}

function translateEventNote(note, language) { const translations = NOTE_TRANSLATIONS[note]; return translations?.[language] || translations?.en || note; }
function normalizeEvents(value) { if (!Array.isArray(value)) return []; return [...value].sort((a, b) => new Date(b.occurred_at || b.created_at || 0).getTime() - new Date(a.occurred_at || a.created_at || 0).getTime()); }
function getEventLabel(type, language, text) { return LABELS[type]?.[language] || LABELS[type]?.en || formatUnknownStatus(type, text.unknown); }
function getEventTone(type) { const tones = { pending: "neutral", driver_assigned: "info", driver_unassigned: "warning", accepted: "info", on_the_way: "purple", arrived: "warning", passenger_called: "info", passenger_on_board: "success", trip_started: "purple", completed: "success", no_show: "danger", cancelled: "danger", transfer_updated: "info", supplier_assigned: "info" }; return tones[type] || "neutral"; }
function formatUnknownStatus(value, fallback) { if (!value || value === "unknown") return fallback; return String(value).replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function formatDateTime(value, language, fallback) { if (!value) return fallback; const date = new Date(value); if (Number.isNaN(date.getTime())) return String(value); return date.toLocaleString(LOCALES[language] || LOCALES.en, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }); }

import {
  Card,
  StatusBadge,
} from "../../../components/ui";

import { useLanguage } from "../../../i18n";
import useTransfer from "../hooks/useTransfer";

const NOTE_TRANSLATIONS = {
  "Transfer tedarikçiye atandı.": {
    tr: "Transfer tedarikçiye atandı.",
    en: "Transfer assigned to supplier.",
    ar: "تم تعيين التحويل للمورد.",
    es: "Traslado asignado al proveedor.",
  },
};

export default function TimelineCard() {
  const { selectedTransfer } = useTransfer();
  const { language } = useLanguage();

  if (!selectedTransfer) {
    return null;
  }

  const events = normalizeEvents(
    selectedTransfer.events,
  );

  return (
    <Card
      className="timeline-card"
      title="Operasyon Zaman Çizelgesi"
      subtitle={`${events.length} olay kaydı`}
    >
      {events.length === 0 ? (
        <div className="timeline-empty">
          Henüz operasyon kaydı bulunmuyor.
        </div>
      ) : (
        <div className="timeline">
          {events.map((event, index) => (
            <TimelineItem
              key={
                event.id ||
                `${event.event_type}-${event.occurred_at}-${index}`
              }
              event={event}
              language={language}
              isLast={index === events.length - 1}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function TimelineItem({
  event,
  language,
  isLast,
}) {
  const type =
    event.event_type ||
    event.status ||
    "unknown";

  return (
    <article className="timeline-item">
      {!isLast && (
        <div className="timeline-line" />
      )}

      <div
        className={`timeline-dot timeline-dot-${getEventTone(
          type,
        )}`}
      />

      <div className="timeline-content">
        <div className="timeline-content-header">
          <div>
            <strong>
              {getEventLabel(type)}
            </strong>

            <small>
              {formatDateTime(
                event.occurred_at ||
                  event.created_at,
              )}
            </small>
          </div>

          <StatusBadge
            status={
              event.status || type
            }
            label={getEventShortLabel(type)}
            tone={getEventTone(type)}
          />
        </div>

        {event.driver?.name && (
          <p className="timeline-actor">
            İşlemi yapan sürücü:{" "}
            <strong>
              {event.driver.name}
            </strong>
          </p>
        )}

        {event.note && (
          <p className="timeline-note">
            {translateEventNote(event.note, language)}
          </p>
        )}

        {(event.latitude ||
          event.longitude) && (
          <div className="timeline-location">
            <span>📍</span>

            <span>
              {event.latitude},{" "}
              {event.longitude}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

function translateEventNote(note, language) {
  const translations = NOTE_TRANSLATIONS[note];

  if (!translations) {
    return note;
  }

  return (
    translations[language] ||
    translations.en ||
    note
  );
}

function normalizeEvents(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...value].sort((a, b) => {
    const firstDate = new Date(
      a.occurred_at ||
        a.created_at ||
        0,
    );

    const secondDate = new Date(
      b.occurred_at ||
        b.created_at ||
        0,
    );

    return (
      secondDate.getTime() -
      firstDate.getTime()
    );
  });
}

function getEventLabel(type) {
  const labels = {
    pending: "Transfer Beklemede",
    driver_assigned: "Sürücü Atandı",
    driver_unassigned:
      "Sürücü Ataması Kaldırıldı",
    accepted: "Transfer Kabul Edildi",
    on_the_way: "Sürücü Yola Çıktı",
    arrived:
      "Sürücü Alış Noktasına Ulaştı",
    passenger_called: "Yolcu Arandı",
    passenger_on_board: "Yolcu Geldi",
    trip_started:
      "Yolculuk Başladı",
    completed:
      "Yolculuk Tamamlandı",
    no_show:
      "Yolcu Gelmedi — No Show",
    cancelled:
      "Transfer İptal Edildi",
  };

  return (
    labels[type] ||
    formatUnknownStatus(type)
  );
}

function getEventShortLabel(type) {
  const labels = {
    driver_assigned: "Atama",
    driver_unassigned: "Atama",
    passenger_called: "Arama",
    passenger_on_board: "Yolcu",
    trip_started: "Başladı",
  };

  return (
    labels[type] ||
    getEventLabel(type)
  );
}

function getEventTone(type) {
  const tones = {
    pending: "neutral",
    driver_assigned: "info",
    driver_unassigned: "warning",
    accepted: "info",
    on_the_way: "purple",
    arrived: "warning",
    passenger_called: "info",
    passenger_on_board: "success",
    trip_started: "purple",
    completed: "success",
    no_show: "danger",
    cancelled: "danger",
  };

  return tones[type] || "neutral";
}

function formatUnknownStatus(value) {
  if (!value) {
    return "Operasyon Kaydı";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatDateTime(value) {
  if (!value) {
    return "Zaman bilgisi yok";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

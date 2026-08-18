import {
  StatusBadge,
} from "../../../components/ui";
import { useLanguage } from "../../../i18n";

const TEXT = {
  tr: { passengerMissing: "Yolcu belirtilmedi", noFlight: "Uçuş yok", noDriver: "Sürücü atanmamış", noPickup: "Alış noktası yok", noDropoff: "Bırakış noktası yok", noDate: "Tarih belirtilmedi" },
  en: { passengerMissing: "Passenger not provided", noFlight: "No flight", noDriver: "No driver assigned", noPickup: "Pickup point not provided", noDropoff: "Dropoff point not provided", noDate: "Date not provided" },
  ar: { passengerMissing: "الراكب غير محدد", noFlight: "لا توجد رحلة", noDriver: "لم يتم تعيين سائق", noPickup: "نقطة الاستلام غير محددة", noDropoff: "نقطة الوصول غير محددة", noDate: "التاريخ غير محدد" },
  es: { passengerMissing: "Pasajero no indicado", noFlight: "Sin vuelo", noDriver: "Sin conductor asignado", noPickup: "Punto de recogida no indicado", noDropoff: "Punto de destino no indicado", noDate: "Fecha no indicada" },
};

const LOCALES = { tr: "tr-TR", en: "en-GB", ar: "ar-SA", es: "es-ES" };

export default function TransferListItem({ transfer, active = false, onClick }) {
  const { language } = useLanguage();
  const text = TEXT[language] || TEXT.en;
  const locale = LOCALES[language] || LOCALES.en;

  return (
    <button className={active ? "transfer-list-item active" : "transfer-list-item"} type="button" onClick={onClick}>
      <div className="transfer-list-item-top">
        <div>
          <strong>{transfer.booking_reference || `#${transfer.id}`}</strong>
          <span>{formatPickupDateTime(transfer.pickup_time, locale, text.noDate)}</span>
        </div>
        <StatusBadge status={transfer.status} />
      </div>

      <div className="transfer-list-item-passenger">{transfer.passenger_name || text.passengerMissing}</div>

      <div className="transfer-list-item-route">
        <span>{getPickupLabel(transfer, text.noPickup)}</span>
        <span className="transfer-list-item-arrow">→</span>
        <span>{getDropoffLabel(transfer, text.noDropoff)}</span>
      </div>

      <div className="transfer-list-item-footer">
        <span>{transfer.flight_number || text.noFlight}</span>
        <span>{transfer.driver?.name || text.noDriver}</span>
      </div>
    </button>
  );
}

function getPickupLabel(transfer, fallback) {
  return transfer.pickup_location?.code || transfer.pickup_location?.name || transfer.pickup || fallback;
}

function getDropoffLabel(transfer, fallback) {
  return transfer.dropoff_location?.code || transfer.dropoff_location?.name || transfer.dropoff || fallback;
}

function formatPickupDateTime(value, locale, fallback) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  const dateLabel = date.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
  const timeLabel = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  return `${dateLabel} · ${timeLabel}`;
}

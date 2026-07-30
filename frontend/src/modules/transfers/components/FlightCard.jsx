import { Card } from "../../../components/ui";
import useTransfer from "../hooks/useTransfer";

export default function FlightCard() {
  const { selectedTransfer } = useTransfer();

  if (!selectedTransfer) {
    return null;
  }

  return (
    <Card
      title="Uçuş"
      subtitle="Uçuş ve karşılama bilgileri"
    >
      <div className="info-row">
        <span>Uçuş Numarası</span>
        <strong>
          {selectedTransfer.flight_number ||
            "Belirtilmedi"}
        </strong>
      </div>

      <div className="info-row">
        <span>Havayolu</span>
        <strong>
          {selectedTransfer.airline ||
            "Belirtilmedi"}
        </strong>
      </div>

      <div className="info-row">
        <span>Terminal</span>
        <strong>
          {selectedTransfer.terminal ||
            "Belirtilmedi"}
        </strong>
      </div>

      <div className="info-row">
        <span>Alış Saati</span>
        <strong>
          {formatDateTime(
            selectedTransfer.pickup_time,
          )}
        </strong>
      </div>

      <div className="info-row">
        <span>Buluşma Noktası</span>
        <strong>
          {selectedTransfer.pickup_point
            ?.name ||
            selectedTransfer.meet_point ||
            "Belirtilmedi"}
        </strong>
      </div>
    </Card>
  );
}

function formatDateTime(value) {
  if (!value) {
    return "Belirtilmedi";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
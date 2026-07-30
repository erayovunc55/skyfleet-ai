import { Card } from "../../../../components/ui";
import useTransfer from "../../hooks/useTransfer";

export default function GPSCard() {
  const { selectedTransfer } = useTransfer();

  if (!selectedTransfer) {
    return null;
  }

  return (
    <Card
      title="Canlı Konum"
      subtitle="GPS Takibi"
    >
      <div className="gps-placeholder">

        <span>🛰️</span>

        <strong>
          Live Tracking
        </strong>

        <small>
          Harita entegrasyonu bir sonraki sprintte
          eklenecek.
        </small>

      </div>

      <div className="info-row">
        <span>Son Konum</span>

        <strong>
          {selectedTransfer.pickup}
        </strong>
      </div>

      <div className="info-row">
        <span>Hedef</span>

        <strong>
          {selectedTransfer.dropoff}
        </strong>
      </div>

    </Card>
  );
}
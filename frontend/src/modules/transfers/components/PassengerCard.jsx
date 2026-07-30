import { Card } from "../../../components/ui";
import useTransfer from "../hooks/useTransfer";

export default function PassengerCard() {
  const { selectedTransfer } = useTransfer();

  if (!selectedTransfer) {
    return null;
  }

  return (
    <Card
      title="Yolcu"
      subtitle="Yolcu bilgileri"
    >
      <div className="info-row">
        <span>Ad Soyad</span>
        <strong>
          {selectedTransfer.passenger_name ||
            "Belirtilmedi"}
        </strong>
      </div>

      <div className="info-row">
        <span>Telefon</span>
        <strong>
          {selectedTransfer.passenger_phone ||
            "Belirtilmedi"}
        </strong>
      </div>

      <div className="info-row">
        <span>E-posta</span>
        <strong>
          {selectedTransfer.passenger_email ||
            "Belirtilmedi"}
        </strong>
      </div>

      <div className="info-row">
        <span>Yetişkin</span>
        <strong>
          {Number(selectedTransfer.adult || 0)}
        </strong>
      </div>

      <div className="info-row">
        <span>Çocuk</span>
        <strong>
          {Number(selectedTransfer.child || 0)}
        </strong>
      </div>

      <div className="info-row">
        <span>Bebek</span>
        <strong>
          {Number(selectedTransfer.baby || 0)}
        </strong>
      </div>

      <div className="info-row">
        <span>Bagaj</span>
        <strong>
          {Number(
            selectedTransfer.luggage_count || 0,
          )}
        </strong>
      </div>
    </Card>
  );
}
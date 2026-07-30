import { Card } from "../../../components/ui";
import useTransfer from "../hooks/useTransfer";

export default function NotesCard() {
  const { selectedTransfer } = useTransfer();

  if (!selectedTransfer) {
    return null;
  }

  return (
    <Card
      title="Operasyon Notları"
      subtitle="Dispatcher ve Yolcu Notları"
    >
      <div className="notes-box">
        <strong>Dispatcher Notu</strong>

        <p>
          {selectedTransfer.driver_note ||
            "Dispatcher notu bulunmuyor."}
        </p>
      </div>

      <div className="notes-box">
        <strong>Yolcu Notu</strong>

        <p>
          {selectedTransfer.passenger_note ||
            "Yolcu notu bulunmuyor."}
        </p>
      </div>
    </Card>
  );
}
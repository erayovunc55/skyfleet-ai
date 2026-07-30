import { Card } from "../../../components/ui";

export default function DocumentsCard() {
  return (
    <Card
      title="Belgeler"
      subtitle="Kanıt Merkezi"
    >
      <div className="document-placeholder">
        📸 Meet & Greet
      </div>

      <div className="document-placeholder">
        📞 Call Log
      </div>

      <div className="document-placeholder">
        📍 GPS Track
      </div>

      <div className="document-placeholder">
        🧾 Voucher
      </div>
    </Card>
  );
}
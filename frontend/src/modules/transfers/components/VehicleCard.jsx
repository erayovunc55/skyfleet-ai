import { Card, StatusBadge } from "../../../components/ui";
import { useLanguage } from "../../../i18n";
import useTransfer from "../hooks/useTransfer";

const TEXT = {
  tr: { title: "Araç", info: "Araç bilgileri", assigned: "Atanan araç", empty: "Bu transfere araç atanmamış.", brandModel: "Marka ve Model", plate: "Plaka", passengerCapacity: "Yolcu Kapasitesi", luggageCapacity: "Bagaj Kapasitesi", status: "Durum", photo: "araç fotoğrafı" },
  en: { title: "Vehicle", info: "Vehicle information", assigned: "Assigned vehicle", empty: "No vehicle assigned to this transfer.", brandModel: "Brand & Model", plate: "Plate", passengerCapacity: "Passenger Capacity", luggageCapacity: "Luggage Capacity", status: "Status", photo: "vehicle photo" },
  ar: { title: "المركبة", info: "معلومات المركبة", assigned: "المركبة المعيّنة", empty: "لم يتم تعيين مركبة لهذا التحويل.", brandModel: "العلامة والطراز", plate: "اللوحة", passengerCapacity: "سعة الركاب", luggageCapacity: "سعة الأمتعة", status: "الحالة", photo: "صورة المركبة" },
  es: { title: "Vehículo", info: "Información del vehículo", assigned: "Vehículo asignado", empty: "No hay vehículo asignado a este traslado.", brandModel: "Marca y modelo", plate: "Matrícula", passengerCapacity: "Capacidad de pasajeros", luggageCapacity: "Capacidad de equipaje", status: "Estado", photo: "foto del vehículo" },
};

export default function VehicleCard() {
  const { language } = useLanguage();
  const text = TEXT[language] || TEXT.en;
  const { selectedTransfer } = useTransfer();
  const vehicle = selectedTransfer?.driver?.vehicle;
  if (!selectedTransfer) return null;
  if (!vehicle) return <Card title={text.title} subtitle={text.info}><div className="transfer-card-empty">{text.empty}</div></Card>;

  return (
    <Card title={text.title} subtitle={text.assigned}>
      {vehicle.photo_url ? <img className="transfer-vehicle-photo" src={vehicle.photo_url} alt={`${vehicle.plate} ${text.photo}`} /> : <div className="transfer-vehicle-placeholder">🚐</div>}
      <Row label={text.brandModel} value={`${vehicle.brand || ""} ${vehicle.model || ""}`.trim()} />
      <Row label={text.plate} value={vehicle.plate} />
      <Row label={text.passengerCapacity} value={Number(vehicle.passenger_capacity || 0)} />
      <Row label={text.luggageCapacity} value={Number(vehicle.luggage_capacity || 0)} />
      <div className="info-row"><span>{text.status}</span><StatusBadge status={vehicle.operational_status || (vehicle.is_active ? "active" : "inactive")} /></div>
    </Card>
  );
}

function Row({ label, value }) { return <div className="info-row"><span>{label}</span><strong>{value}</strong></div>; }

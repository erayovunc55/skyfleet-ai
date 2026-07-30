import {
  Card,
  StatusBadge,
} from "../../../components/ui";

import useTransfer from "../hooks/useTransfer";

export default function VehicleCard() {
  const { selectedTransfer } = useTransfer();

  const vehicle =
    selectedTransfer?.driver?.vehicle;

  if (!selectedTransfer) {
    return null;
  }

  if (!vehicle) {
    return (
      <Card
        title="Araç"
        subtitle="Araç bilgileri"
      >
        <div className="transfer-card-empty">
          Bu transfere araç atanmamış.
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Araç"
      subtitle="Atanan araç"
    >
      {vehicle.photo_url ? (
        <img
          className="transfer-vehicle-photo"
          src={vehicle.photo_url}
          alt={`${vehicle.plate} araç fotoğrafı`}
        />
      ) : (
        <div className="transfer-vehicle-placeholder">
          🚐
        </div>
      )}

      <div className="info-row">
        <span>Marka ve Model</span>
        <strong>
          {vehicle.brand} {vehicle.model}
        </strong>
      </div>

      <div className="info-row">
        <span>Plaka</span>
        <strong>{vehicle.plate}</strong>
      </div>

      <div className="info-row">
        <span>Yolcu Kapasitesi</span>
        <strong>
          {Number(
            vehicle.passenger_capacity || 0,
          )}
        </strong>
      </div>

      <div className="info-row">
        <span>Bagaj Kapasitesi</span>
        <strong>
          {Number(
            vehicle.luggage_capacity || 0,
          )}
        </strong>
      </div>

      <div className="info-row">
        <span>Durum</span>

        <StatusBadge
          status={
            vehicle.operational_status ||
            (vehicle.is_active
              ? "active"
              : "inactive")
          }
        />
      </div>
    </Card>
  );
}
import DriverSelector from "./DriverSelector";
import VehicleInsuranceStatus from "./VehicleInsuranceStatus";
import VehicleStatusSelector from "./VehicleStatusSelector";

export default function VehicleCard({
  vehicle,
  drivers,
  updatingVehicleId,
  uploadingVehicleId,
  assigningVehicleId,
  onStatusChange,
  onPhotoUpload,
  onDriverAssign,
}) {
  const operationalStatus =
    getVehicleOperationalStatus(vehicle);

  return (
    <article className="vehicle-card">
      <div className="vehicle-card-photo">
        {vehicle.photo_url ? (
          <img
            src={vehicle.photo_url}
            alt={`${vehicle.plate} araç fotoğrafı`}
          />
        ) : (
          <div className="vehicle-card-photo-placeholder">
            🚐
          </div>
        )}

        <label className="vehicle-card-photo-action">
          {uploadingVehicleId === vehicle.id
            ? "Yükleniyor..."
            : vehicle.photo_url
              ? "Fotoğrafı Değiştir"
              : "Fotoğraf Yükle"}

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={
              uploadingVehicleId === vehicle.id
            }
            onChange={(event) => {
              const file =
                event.target.files?.[0];

              onPhotoUpload(vehicle, file);

              event.target.value = "";
            }}
          />
        </label>
      </div>

      <div className="vehicle-card-top">
        <div>
          <span
            className={`vehicle-status ${operationalStatus}`}
          >
            {getOperationalStatusLabel(
              operationalStatus,
            )}
          </span>

          <h3>{vehicle.plate}</h3>

          <p>
            {vehicle.brand} {vehicle.model}
          </p>
        </div>

        <strong>{vehicle.year || "—"}</strong>
      </div>

      <div className="vehicle-card-grid">
        <div>
          <span>Tür</span>

          <strong>
            {vehicle.vehicle_type ||
              "Belirtilmedi"}
          </strong>
        </div>

        <div>
          <span>Kapasite</span>

          <strong>
            {Number(
              vehicle.passenger_capacity || 0,
            )}{" "}
            yolcu
          </strong>
        </div>

        <div>
          <span>Bagaj</span>

          <strong>
            {Number(
              vehicle.luggage_capacity || 0,
            )}{" "}
            adet
          </strong>
        </div>

        <div>
          <span>Kilometre</span>

          <strong>
            {formatMileage(
              vehicle.current_mileage,
            )}
          </strong>
        </div>
      </div>

      <VehicleInsuranceStatus
        expiryDate={
          vehicle.insurance_expiry_date
        }
      />

      <DriverSelector
        vehicle={vehicle}
        drivers={drivers}
        isUpdating={
          assigningVehicleId === vehicle.id
        }
        onAssign={onDriverAssign}
      />

      <VehicleStatusSelector
        vehicle={vehicle}
        status={operationalStatus}
        isUpdating={
          updatingVehicleId === vehicle.id
        }
        onChange={onStatusChange}
      />

      {vehicle.note && (
        <div className="vehicle-card-note">
          <span>Not</span>
          <p>{vehicle.note}</p>
        </div>
      )}
    </article>
  );
}

function formatMileage(value) {
  return `${Number(
    value || 0,
  ).toLocaleString("tr-TR")} km`;
}

function getOperationalStatusLabel(status) {
  const labels = {
    active: "Aktif",
    service: "Serviste",
    faulty: "Arızalı",
    inactive: "Pasif",
  };

  return labels[status] || "Aktif";
}

function getVehicleOperationalStatus(vehicle) {
  if (vehicle?.operational_status) {
    return vehicle.operational_status;
  }

  return vehicle?.is_active
    ? "active"
    : "inactive";
}
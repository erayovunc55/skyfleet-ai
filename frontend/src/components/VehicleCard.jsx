import DriverSelector from "./DriverSelector";
import VehicleInsuranceStatus from "./VehicleInsuranceStatus";
import VehicleStatusSelector from "./VehicleStatusSelector";
import { useLanguage } from "../i18n";

const TEXT = {
  tr: { upload: "Fotoğraf Yükle", change: "Fotoğrafı Değiştir", uploading: "Yükleniyor...", type: "Tür", capacity: "Kapasite", passenger: "yolcu", luggage: "Bagaj", piece: "adet", mileage: "Kilometre", note: "Not", noValue: "Belirtilmedi", active: "Aktif", service: "Serviste", faulty: "Arızalı", inactive: "Pasif", vehiclePhoto: "araç fotoğrafı" },
  en: { upload: "Upload Photo", change: "Change Photo", uploading: "Uploading...", type: "Type", capacity: "Capacity", passenger: "passengers", luggage: "Luggage", piece: "pcs", mileage: "Mileage", note: "Note", noValue: "Not provided", active: "Active", service: "In Service", faulty: "Faulty", inactive: "Inactive", vehiclePhoto: "vehicle photo" },
  ar: { upload: "رفع صورة", change: "تغيير الصورة", uploading: "جارٍ الرفع...", type: "النوع", capacity: "السعة", passenger: "ركاب", luggage: "الأمتعة", piece: "قطع", mileage: "المسافة", note: "ملاحظة", noValue: "غير محدد", active: "نشطة", service: "في الصيانة", faulty: "معطلة", inactive: "غير نشطة", vehiclePhoto: "صورة المركبة" },
  es: { upload: "Subir Foto", change: "Cambiar Foto", uploading: "Subiendo...", type: "Tipo", capacity: "Capacidad", passenger: "pasajeros", luggage: "Equipaje", piece: "uds.", mileage: "Kilometraje", note: "Nota", noValue: "No indicado", active: "Activo", service: "En Servicio", faulty: "Averiado", inactive: "Inactivo", vehiclePhoto: "foto del vehículo" },
};

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
  const { language } = useLanguage();
  const text = TEXT[language] || TEXT.en;
  const operationalStatus = getVehicleOperationalStatus(vehicle);
  const assignedDriver = drivers.find(
    (driver) => Number(driver.vehicle_id) === Number(vehicle.id),
  );

  return (
    <article className="vehicle-card fleet-vehicle-card">
      <div className="vehicle-card-photo">
        {vehicle.photo_url ? (
          <img src={vehicle.photo_url} alt={`${vehicle.plate} ${text.vehiclePhoto}`} />
        ) : (
          <div className="vehicle-card-photo-placeholder">🚐</div>
        )}
        <div className="vehicle-photo-overlay">
          <span className={`vehicle-status ${operationalStatus}`}>
            {getOperationalStatusLabel(operationalStatus, text)}
          </span>
          {assignedDriver && <span className="vehicle-driver-chip">👤 {assignedDriver.name}</span>}
        </div>
        <label className="vehicle-card-photo-action">
          {uploadingVehicleId === vehicle.id
            ? text.uploading
            : vehicle.photo_url ? text.change : text.upload}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploadingVehicleId === vehicle.id}
            onChange={(event) => {
              const file = event.target.files?.[0];
              onPhotoUpload(vehicle, file);
              event.target.value = "";
            }}
          />
        </label>
      </div>

      <div className="vehicle-card-top fleet-vehicle-identity">
        <div>
          <h3>{vehicle.plate}</h3>
          <p>{vehicle.brand} {vehicle.model}</p>
        </div>
        <div className="vehicle-year-badge">{vehicle.year || "—"}</div>
      </div>

      <div className="vehicle-card-grid fleet-vehicle-metrics">
        <Metric label={text.type} value={vehicle.vehicle_type || text.noValue} />
        <Metric label={text.capacity} value={`${Number(vehicle.passenger_capacity || 0)} ${text.passenger}`} />
        <Metric label={text.luggage} value={`${Number(vehicle.luggage_capacity || 0)} ${text.piece}`} />
        <Metric label={text.mileage} value={formatMileage(vehicle.current_mileage, language)} />
      </div>

      <VehicleInsuranceStatus expiryDate={vehicle.insurance_expiry_date} />

      <div className="fleet-vehicle-controls">
        <DriverSelector
          vehicle={vehicle}
          drivers={drivers}
          isUpdating={assigningVehicleId === vehicle.id}
          onAssign={onDriverAssign}
        />
        <VehicleStatusSelector
          vehicle={vehicle}
          status={operationalStatus}
          isUpdating={updatingVehicleId === vehicle.id}
          onChange={onStatusChange}
        />
      </div>

      {vehicle.note && (
        <div className="vehicle-card-note">
          <span>{text.note}</span>
          <p>{vehicle.note}</p>
        </div>
      )}
    </article>
  );
}

function Metric({ label, value }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function formatMileage(value, language) {
  const locales = { tr: "tr-TR", en: "en-GB", ar: "ar-SA", es: "es-ES" };
  return `${Number(value || 0).toLocaleString(locales[language] || "en-GB")} km`;
}

function getOperationalStatusLabel(status, text) {
  return ({ active: text.active, service: text.service, faulty: text.faulty, inactive: text.inactive })[status] || text.active;
}

function getVehicleOperationalStatus(vehicle) {
  if (vehicle?.operational_status) return vehicle.operational_status;
  return vehicle?.is_active ? "active" : "inactive";
}

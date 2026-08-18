import { useLanguage } from "../i18n";

const TEXT = {
  tr: { assigned: "Atanan Sürücü", select: "Sürücü seçiniz", phoneMissing: "Telefon bilgisi yok", updating: "Güncelleniyor..." },
  en: { assigned: "Assigned Driver", select: "Select driver", phoneMissing: "Phone not available", updating: "Updating..." },
  ar: { assigned: "السائق المعين", select: "اختر السائق", phoneMissing: "رقم الهاتف غير متاح", updating: "جارٍ التحديث..." },
  es: { assigned: "Conductor Asignado", select: "Seleccionar conductor", phoneMissing: "Teléfono no disponible", updating: "Actualizando..." },
};

export default function DriverSelector({ vehicle, drivers, isUpdating, onAssign }) {
  const { language } = useLanguage();
  const text = TEXT[language] || TEXT.en;
  const assignedDriver = drivers.find(
    (driver) => Number(driver.vehicle_id) === Number(vehicle.id),
  ) || null;

  return (
    <div className="driver-selector">
      <label>
        {text.assigned}
        <select
          value={assignedDriver?.id || ""}
          disabled={isUpdating}
          onChange={(event) => onAssign(
            vehicle,
            event.target.value ? Number(event.target.value) : null,
          )}
        >
          <option value="">{text.select}</option>
          {drivers.map((driver) => (
            <option key={driver.id} value={driver.id}>{driver.name}</option>
          ))}
        </select>
      </label>
      {assignedDriver && (
        <div className="driver-selector-info">
          <strong>{assignedDriver.name}</strong>
          <small>{assignedDriver.phone || text.phoneMissing}</small>
        </div>
      )}
      {isUpdating && <small>{text.updating}</small>}
    </div>
  );
}

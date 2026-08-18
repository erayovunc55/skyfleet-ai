import { useLanguage } from "../i18n";

const TEXT = {
  tr: { label: "Araç Durumu", active: "Aktif", service: "Serviste", faulty: "Arızalı", inactive: "Pasif", updating: "Durum güncelleniyor..." },
  en: { label: "Vehicle Status", active: "Active", service: "In Service", faulty: "Faulty", inactive: "Inactive", updating: "Updating status..." },
  ar: { label: "حالة المركبة", active: "نشطة", service: "في الصيانة", faulty: "معطلة", inactive: "غير نشطة", updating: "جارٍ تحديث الحالة..." },
  es: { label: "Estado del Vehículo", active: "Activo", service: "En Servicio", faulty: "Averiado", inactive: "Inactivo", updating: "Actualizando estado..." },
};

export default function VehicleStatusSelector({ vehicle, status, isUpdating, onChange }) {
  const { language } = useLanguage();
  const text = TEXT[language] || TEXT.en;

  return (
    <div className="vehicle-status-actions">
      <label>
        {text.label}
        <select
          value={status}
          disabled={isUpdating}
          onChange={(event) => onChange(vehicle, event.target.value)}
        >
          <option value="active">{text.active}</option>
          <option value="service">{text.service}</option>
          <option value="faulty">{text.faulty}</option>
          <option value="inactive">{text.inactive}</option>
        </select>
      </label>
      {isUpdating && <small>{text.updating}</small>}
    </div>
  );
}

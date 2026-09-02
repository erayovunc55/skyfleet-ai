import { Avatar, Card, StatusBadge } from "../../../components/ui";
import { useLanguage } from "../../../i18n";
import useTransfer from "../hooks/useTransfer";

const TEXT = {
  tr: { title: "Sürücü", info: "Sürücü bilgileri", assigned: "Atanan sürücü", empty: "Bu transfere sürücü atanmamış.", noPhone: "Telefon bilgisi yok", supplier: "Tedarikçi", status: "Durum", missing: "Belirtilmedi" },
  en: { title: "Driver", info: "Driver information", assigned: "Assigned driver", empty: "No driver assigned to this transfer.", noPhone: "Phone not available", supplier: "Supplier", status: "Status", missing: "Not provided" },
  ar: { title: "السائق", info: "معلومات السائق", assigned: "السائق المعيّن", empty: "لم يتم تعيين سائق لهذا التحويل.", noPhone: "الهاتف غير متاح", supplier: "المورد", status: "الحالة", missing: "غير محدد" },
  es: { title: "Conductor", info: "Información del conductor", assigned: "Conductor asignado", empty: "No hay conductor asignado a este traslado.", noPhone: "Teléfono no disponible", supplier: "Proveedor", status: "Estado", missing: "No indicado" },
};

export default function DriverCard() {
  const { language } = useLanguage();
  const text = TEXT[language] || TEXT.en;
  const { selectedTransfer } = useTransfer();
  const driver = selectedTransfer?.driver;
  if (!selectedTransfer) return null;
  if (!driver) return <Card title={text.title} subtitle={text.info}><div className="transfer-card-empty">{text.empty}</div></Card>;
  return (
    <Card title={text.title} subtitle={text.assigned}>
      <div className="driver-card-header">
        <Avatar name={driver.name} image={driver.avatar_url || driver.photo_url || ""} size="lg" />
        <div><strong>{driver.name}</strong><small>{driver.phone || text.noPhone}</small></div>
      </div>
      <div className="info-row"><span>{text.supplier}</span><strong>{driver.supplier || selectedTransfer.supplier || text.missing}</strong></div>
      <div className="info-row"><span>{text.status}</span><StatusBadge status={selectedTransfer.operation_summary?.driver_status || (driver.is_active ? "active" : "inactive")} /></div>
    </Card>
  );
}

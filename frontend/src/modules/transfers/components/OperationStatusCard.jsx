import { useEffect, useState } from "react";
import { Button, Card, StatusBadge } from "../../../components/ui";
import { useLanguage } from "../../../i18n";
import apiClient from "../../../services/apiClient";
import useTransfer from "../hooks/useTransfer";

const STATUS_LABELS = {
  tr: { pending: "Bekliyor", accepted: "Kabul Edildi", on_the_way: "Yola Çıkıldı", arrived: "Alış Noktasında", passenger_called: "Yolcu Arandı", passenger_on_board: "Yolcu Geldi", trip_started: "Yolculuk Başladı", completed: "Tamamlandı", no_show: "No Show", cancelled: "İptal Edildi", unknown: "Bilinmiyor" },
  en: { pending: "Waiting", accepted: "Accepted", on_the_way: "En Route", arrived: "At Pickup", passenger_called: "Passenger Contacted", passenger_on_board: "Passenger On Board", trip_started: "Trip Started", completed: "Completed", no_show: "No Show", cancelled: "Cancelled", unknown: "Unknown" },
  ar: { pending: "قيد الانتظار", accepted: "تم القبول", on_the_way: "في الطريق", arrived: "في نقطة الاستلام", passenger_called: "تم التواصل مع الراكب", passenger_on_board: "الراكب في المركبة", trip_started: "بدأت الرحلة", completed: "مكتمل", no_show: "عدم حضور", cancelled: "ملغى", unknown: "غير معروف" },
  es: { pending: "Pendiente", accepted: "Aceptado", on_the_way: "En camino", arrived: "En recogida", passenger_called: "Pasajero contactado", passenger_on_board: "Pasajero a bordo", trip_started: "Viaje iniciado", completed: "Completado", no_show: "No show", cancelled: "Cancelado", unknown: "Desconocido" },
};

const TEXT = {
  tr: { title: "Operasyon Durumu", subtitle: "Transfer akışını yönetin", current: "Mevcut Durum", next: "Yeni Durum", note: "Dispatcher Notu", placeholder: "Durum değişikliğiyle ilgili açıklama ekleyin...", update: "Durumu Güncelle", choose: "Lütfen bir operasyon durumu seçin.", unchanged: "Durum değişmedi. Not ekleyin veya farklı bir durum seçin.", success: "Transfer durumu güncellendi.", error: "Transfer durumu güncellenemedi." },
  en: { title: "Operation Status", subtitle: "Manage the transfer workflow", current: "Current Status", next: "New Status", note: "Dispatcher Note", placeholder: "Add a note about the status change...", update: "Update Status", choose: "Please select an operation status.", unchanged: "The status has not changed. Add a note or select a different status.", success: "Transfer status updated.", error: "Transfer status could not be updated." },
  ar: { title: "حالة العملية", subtitle: "إدارة سير التحويل", current: "الحالة الحالية", next: "الحالة الجديدة", note: "ملاحظة المرسل", placeholder: "أضف ملاحظة حول تغيير الحالة...", update: "تحديث الحالة", choose: "يرجى اختيار حالة العملية.", unchanged: "لم تتغير الحالة. أضف ملاحظة أو اختر حالة مختلفة.", success: "تم تحديث حالة التحويل.", error: "تعذر تحديث حالة التحويل." },
  es: { title: "Estado de la operación", subtitle: "Gestiona el flujo del traslado", current: "Estado actual", next: "Nuevo estado", note: "Nota del dispatcher", placeholder: "Añade una nota sobre el cambio de estado...", update: "Actualizar estado", choose: "Selecciona un estado de operación.", unchanged: "El estado no cambió. Añade una nota o selecciona otro estado.", success: "Estado del traslado actualizado.", error: "No se pudo actualizar el estado del traslado." },
};

export default function OperationStatusCard() {
  const { language } = useLanguage();
  const text = TEXT[language] || TEXT.en;
  const labels = STATUS_LABELS[language] || STATUS_LABELS.en;
  const { selectedTransfer, updateSelectedTransfer } = useTransfer();
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setStatus(selectedTransfer?.status || "");
    setNote(""); setError(""); setMessage("");
  }, [selectedTransfer?.id]);

  if (!selectedTransfer) return null;
  const statusChanged = status !== selectedTransfer.status;

  async function handleSave() {
    if (!status) { setError(text.choose); return; }
    if (status === selectedTransfer.status && !note.trim()) { setError(text.unchanged); return; }
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await apiClient.patch(`/transfers/${selectedTransfer.id}/status`, { status, note: note.trim() || null });
      const updatedTransfer = response.data?.data || {};
      updateSelectedTransfer(updatedTransfer);
      setMessage(response.data?.message || text.success);
      setNote("");
    } catch (requestError) {
      const validationErrors = requestError?.response?.data?.errors;
      const firstValidationError = validationErrors ? Object.values(validationErrors).flat().find(Boolean) : null;
      setError(firstValidationError || requestError?.response?.data?.message || text.error);
    } finally { setSaving(false); }
  }

  const getLabel = (value) => labels[value] || value || labels.unknown;

  return (
    <Card title={text.title} subtitle={text.subtitle} actions={<StatusBadge status={selectedTransfer.status} />}>
      <div className="operation-status-current"><span>{text.current}</span><strong>{getLabel(selectedTransfer.status)}</strong></div>
      <div className="operation-status-field">
        <label htmlFor="operation-status">{text.next}</label>
        <select id="operation-status" value={status} disabled={saving} onChange={(event) => { setStatus(event.target.value); setError(""); setMessage(""); }}>
          {Object.keys(labels).filter((key) => key !== "unknown").map((value) => <option key={value} value={value}>{labels[value]}</option>)}
        </select>
      </div>
      <div className="operation-status-field">
        <label htmlFor="operation-status-note">{text.note}</label>
        <textarea id="operation-status-note" rows="4" value={note} disabled={saving} placeholder={text.placeholder} onChange={(event) => { setNote(event.target.value); setError(""); setMessage(""); }} />
      </div>
      {statusChanged && <div className="operation-status-change"><span>{getLabel(selectedTransfer.status)}</span><strong>→</strong><span>{getLabel(status)}</span></div>}
      {error && <div className="assignment-message error">{error}</div>}
      {message && <div className="assignment-message success">{message}</div>}
      <Button variant={status === "cancelled" || status === "no_show" ? "danger" : status === "completed" ? "success" : "primary"} loading={saving} onClick={handleSave}>{text.update}</Button>
    </Card>
  );
}

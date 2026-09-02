import "./badge.css";
import { useLanguage } from "../../../i18n";

const STATUS_CONFIG = {
  pending: ["warning", { tr: "Bekliyor", en: "Waiting", ar: "قيد الانتظار", es: "Pendiente" }],
  under_review: ["info", { tr: "İnceleniyor", en: "Under Review", ar: "قيد المراجعة", es: "En revisión" }],
  revision_requested: ["warning", { tr: "Revizyon Gerekli", en: "Revision Required", ar: "مطلوب تعديل", es: "Revisión requerida" }],
  approved: ["success", { tr: "Onaylandı", en: "Approved", ar: "تمت الموافقة", es: "Aprobado" }],
  active: ["success", { tr: "Aktif", en: "Active", ar: "نشط", es: "Activo" }],
  available: ["info", { tr: "Müsait", en: "Available", ar: "متاح", es: "Disponible" }],
  on_duty: ["success", { tr: "Görevde", en: "On Duty", ar: "في الخدمة", es: "En servicio" }],
  accepted: ["info", { tr: "Kabul Edildi", en: "Accepted", ar: "تم القبول", es: "Aceptado" }],
  on_the_way: ["purple", { tr: "Yola Çıkıldı", en: "En Route", ar: "في الطريق", es: "En camino" }],
  arrived: ["warning", { tr: "Konumda", en: "At Pickup", ar: "في نقطة الاستلام", es: "En recogida" }],
  passenger_called: ["info", { tr: "Yolcu Arandı", en: "Passenger Contacted", ar: "تم التواصل مع الراكب", es: "Pasajero contactado" }],
  passenger_on_board: ["success", { tr: "Yolcu Araçta", en: "Passenger On Board", ar: "الراكب في المركبة", es: "Pasajero a bordo" }],
  trip_started: ["purple", { tr: "Yolculuk Başladı", en: "Trip Started", ar: "بدأت الرحلة", es: "Viaje iniciado" }],
  completed: ["success", { tr: "Tamamlandı", en: "Completed", ar: "مكتمل", es: "Completado" }],
  rejected: ["danger", { tr: "Reddedildi", en: "Rejected", ar: "مرفوض", es: "Rechazado" }],
  suspended: ["danger", { tr: "Askıya Alındı", en: "Suspended", ar: "معلق", es: "Suspendido" }],
  cancelled: ["danger", { tr: "İptal Edildi", en: "Cancelled", ar: "ملغى", es: "Cancelado" }],
  no_show: ["danger", { tr: "No Show", en: "No Show", ar: "عدم حضور", es: "No show" }],
  service: ["warning", { tr: "Serviste", en: "In Service", ar: "في الصيانة", es: "En servicio" }],
  faulty: ["danger", { tr: "Arızalı", en: "Faulty", ar: "معطل", es: "Averiado" }],
  inactive: ["neutral", { tr: "Pasif", en: "Inactive", ar: "غير نشط", es: "Inactivo" }],
};

export default function StatusBadge({ status, label, tone, className = "" }) {
  const { language } = useLanguage();
  const config = STATUS_CONFIG[status] || [tone || "neutral", null];
  const resolvedTone = tone || config[0];
  const translatedDefault = config[1]?.[language] || config[1]?.en || status || (language === "tr" ? "Bilinmiyor" : language === "ar" ? "غير معروف" : language === "es" ? "Desconocido" : "Unknown");
  const resolvedLabel = label || translatedDefault;

  return (
    <span className={["sf-badge", `sf-badge-${resolvedTone}`, className].filter(Boolean).join(" ")}>
      <span className="sf-badge-dot" />
      {resolvedLabel}
    </span>
  );
}

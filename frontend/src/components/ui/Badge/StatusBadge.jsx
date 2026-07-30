import "./badge.css";

const STATUS_CONFIG = {
  pending: ["warning", "Bekliyor"],
  under_review: ["info", "İnceleniyor"],
  revision_requested: ["warning", "Revizyon Gerekli"],
  approved: ["success", "Onaylandı"],
  active: ["success", "Aktif"],
  available: ["info", "Müsait"],
  on_duty: ["success", "Görevde"],
  accepted: ["info", "Kabul Edildi"],
  on_the_way: ["purple", "Yola Çıkıldı"],
  arrived: ["warning", "Konumda"],
  trip_started: ["purple", "Yolculuk Başladı"],
  completed: ["success", "Tamamlandı"],
  rejected: ["danger", "Reddedildi"],
  suspended: ["danger", "Askıya Alındı"],
  cancelled: ["danger", "İptal Edildi"],
  no_show: ["danger", "No Show"],
  service: ["warning", "Serviste"],
  faulty: ["danger", "Arızalı"],
  inactive: ["neutral", "Pasif"],
};

export default function StatusBadge({
  status,
  label,
  tone,
  className = "",
}) {
  const config = STATUS_CONFIG[status] || [
    tone || "neutral",
    label || status || "Bilinmiyor",
  ];

  const resolvedTone = tone || config[0];
  const resolvedLabel = label || config[1];

  return (
    <span
      className={[
        "sf-badge",
        `sf-badge-${resolvedTone}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="sf-badge-dot" />
      {resolvedLabel}
    </span>
  );
}
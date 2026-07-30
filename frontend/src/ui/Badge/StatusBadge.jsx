import "./badge.css";

const STATUS_CONFIG = {
  pending: ["warning", "Bekliyor"],
  under_review: ["info", "İnceleniyor"],
  revision_requested: ["warning", "Revizyon Gerekli"],
  approved: ["success", "Onaylandı"],
  active: ["success", "Aktif"],
  completed: ["success", "Tamamlandı"],
  rejected: ["danger", "Reddedildi"],
  suspended: ["danger", "Askıya Alındı"],
  cancelled: ["danger", "İptal Edildi"],
  inactive: ["neutral", "Pasif"],
  service: ["warning", "Serviste"],
  faulty: ["danger", "Arızalı"],
};

export default function StatusBadge({
  status,
  label,
  tone,
  className = "",
}) {
  const config =
    STATUS_CONFIG[status] || [
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
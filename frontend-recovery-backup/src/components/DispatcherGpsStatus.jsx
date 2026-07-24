export default function DispatcherGpsStatus({
  lastGpsAt,
}) {
  const gps = getGpsStatus(lastGpsAt);

  return (
    <div className={`dispatcher-gps-status ${gps.className}`}>
      <div className="dispatcher-gps-status-header">
        <span className="dispatcher-gps-dot" />

        <span>Son GPS</span>
      </div>

      <strong>{gps.timeLabel}</strong>

      <small>{gps.message}</small>
    </div>
  );
}

function getGpsStatus(lastGpsAt) {
  if (!lastGpsAt) {
    return {
      className: "unknown",
      timeLabel: "--:--",
      message: "Konum verisi yok",
    };
  }

  const timestamp = new Date(lastGpsAt).getTime();

  if (Number.isNaN(timestamp)) {
    return {
      className: "unknown",
      timeLabel: "--:--",
      message: "Geçersiz konum zamanı",
    };
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 1000),
  );

  const timeLabel = new Date(lastGpsAt).toLocaleTimeString(
    "tr-TR",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  if (elapsedSeconds <= 120) {
    return {
      className: "online",
      timeLabel,
      message: "Canlı bağlantı",
    };
  }

  if (elapsedSeconds <= 900) {
    return {
      className: "recent",
      timeLabel,
      message: `${Math.floor(elapsedSeconds / 60)} dk önce`,
    };
  }

  if (elapsedSeconds <= 3600) {
    return {
      className: "delayed",
      timeLabel,
      message: `${Math.floor(elapsedSeconds / 60)} dk önce`,
    };
  }

  const elapsedHours = Math.floor(elapsedSeconds / 3600);

  if (elapsedHours < 24) {
    return {
      className: "offline",
      timeLabel,
      message: `${elapsedHours} saat önce`,
    };
  }

  const elapsedDays = Math.floor(elapsedHours / 24);

  return {
    className: "offline",
    timeLabel,
    message: `${elapsedDays} gün önce`,
  };
}
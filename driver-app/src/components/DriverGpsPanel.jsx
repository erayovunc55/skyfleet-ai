import useDriverLocation from "../hooks/useDriverLocation";

export default function DriverGpsPanel({
  transferId,
  enabled = false,
  sendInterval = 5000,
}) {
  const {
    location,
    permissionState,
    tracking,
    error,
    lastSentAt,
    startTracking,
    stopTracking,
  } = useDriverLocation({
    transferId,
    enabled,
    sendInterval,
  });

  return (
    <section className="driver-gps-card">
      <div className="driver-gps-header">
        <div>
          <span>CANLI TAKİP</span>
          <h2>GPS Paylaşımı</h2>
        </div>

        <div
          className={
            tracking
              ? "driver-gps-status active"
              : "driver-gps-status"
          }
        >
          <span />

          {tracking
            ? "Konum Paylaşılıyor"
            : enabled
              ? "GPS Kapalı"
              : "Takip Tamamlandı"}
        </div>
      </div>

      <div className="driver-gps-actions">
        <div className={
          tracking
            ? "driver-gps-status active"
            : "driver-gps-status"
        } aria-hidden="true">
          <span />
          {!enabled
            ? "GPS takibi tamamlandı"
            : permissionState === "prompt" || permissionState === "unknown"
            ? "Konum izni bekleniyor"
            : permissionState === "denied"
            ? "Konum izni reddedildi"
            : !navigator.geolocation || permissionState === "unsupported"
            ? "GPS kullanılamıyor"
            : tracking
            ? "GPS aktif"
            : "GPS Kapalı"}
        </div>

        {enabled && !tracking && (
          <button
            type="button"
            className="driver-gps-action-button"
            onClick={startTracking}
          >
            GPS&apos;i Başlat
          </button>
        )}
      </div>
      <div className="driver-gps-summary">
        <GpsRow
          label="Konum İzni"
          value={getPermissionLabel(
            permissionState,
          )}
        />

        <GpsRow
          label="Enlem"
          value={
            location?.latitude
              ? location.latitude
                  .toFixed(7)
              : "Bekleniyor"
          }
        />

        <GpsRow
          label="Boylam"
          value={
            location?.longitude
              ? location.longitude
                  .toFixed(7)
              : "Bekleniyor"
          }
        />

        <GpsRow
          label="Hassasiyet"
          value={
            location?.accuracy
              ? `${Math.round(
                  location.accuracy,
                )} metre`
              : "Bekleniyor"
          }
        />

        <GpsRow
          label="Hız"
          value={
            Number.isFinite(
              location?.speed,
            ) &&
            location.speed >= 0
              ? `${(
                  location.speed *
                  3.6
                ).toFixed(1)} km/s`
              : "Bilinmiyor"
          }
        />

        <GpsRow
          label="Son Gönderim"
          value={formatTime(
            lastSentAt,
          )}
        />
      </div>

      {error && (
        <div className="driver-action-message error">
          {error}
        </div>
      )}
    </section>
  );
}

function GpsRow({
  label,
  value,
}) {
  return (
    <div className="driver-gps-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getPermissionLabel(
  state,
) {
  const labels = {
    unknown: "Konum izni bekleniyor",
    prompt: "Konum izni bekleniyor",
    granted: "Konum izni verildi",
    denied: "Konum izni reddedildi",
  };

  return labels[state] || state;
}

function formatTime(value) {
  if (!value) {
    return "Henüz gönderilmedi";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Bilinmiyor";
  }

  return date.toLocaleTimeString(
    "tr-TR",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    },
  );
}




import {
  Button,
  Card,
  StatusBadge,
} from "../../../components/ui";

import useDriverLocation from "../hooks/useDriverLocation";

export default function DriverGpsPanel({
  transferId,
  autoStart = false,
}) {
  const {
    location,
    permissionState,
    tracking,
    sending,
    error,
    lastSentAt,
    startTracking,
    stopTracking,
    sendNow,
  } = useDriverLocation({
    transferId,
    enabled: autoStart,
    sendInterval: 10000,
  });

  return (
    <Card
      title="Canlı GPS"
      subtitle="Sürücü konum paylaşımı"
      actions={
        <StatusBadge
          status={
            tracking ? "active" : "inactive"
          }
          label={
            tracking
              ? "Konum Paylaşılıyor"
              : "GPS Kapalı"
          }
        />
      }
    >
      <div className="driver-gps-actions">
        {!tracking ? (
          <Button
            variant="success"
            disabled={!transferId}
            onClick={startTracking}
          >
            GPS Takibini Başlat
          </Button>
        ) : (
          <Button
            variant="danger"
            onClick={stopTracking}
          >
            GPS Takibini Durdur
          </Button>
        )}

        <Button
          variant="ghost"
          disabled={!location || sending}
          loading={sending}
          onClick={sendNow}
        >
          Konumu Şimdi Gönder
        </Button>
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
            location?.latitude?.toFixed(7) ||
            "Bekleniyor"
          }
        />

        <GpsRow
          label="Boylam"
          value={
            location?.longitude?.toFixed(7) ||
            "Bekleniyor"
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
          label="Son Gönderim"
          value={formatDateTime(lastSentAt)}
        />
      </div>

      {error && (
        <div className="assignment-message error">
          {error}
        </div>
      )}
    </Card>
  );
}

function GpsRow({ label, value }) {
  return (
    <div className="driver-gps-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getPermissionLabel(state) {
  const labels = {
    granted: "İzin Verildi",
    denied: "İzin Reddedildi",
    prompt: "İzin Bekleniyor",
    unknown: "Henüz Sorulmadı",
  };

  return labels[state] || state;
}

function formatDateTime(value) {
  if (!value) {
    return "Henüz gönderilmedi";
  }

  const date = new Date(value);

  return date.toLocaleString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
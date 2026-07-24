import DispatcherGpsStatus from "./DispatcherGpsStatus";
export default function DispatcherTransferCard({
  transfer,
  onViewDetail,
}) {
  const vehicle = transfer.driver_vehicle;
  const operationSummary =
    transfer.operation_summary || {};

  return (
    <article className="dispatcher-transfer-card">
      <div className="dispatcher-transfer-top">
        <div>
          <span
            className={`dispatcher-status ${transfer.status}`}
          >
            {getStatusLabel(transfer.status)}
          </span>

          <h3>
            {transfer.pickup} → {transfer.dropoff}
          </h3>
        </div>

        <strong>{transfer.pickup_time}</strong>
      </div>

      <div className="dispatcher-transfer-grid">
        <div className="dispatcher-driver-card">
  <span>Sürücü</span>

  <div className="dispatcher-driver-header">

    {transfer.driver_avatar ? (
      <img
        src={transfer.driver_avatar}
        alt={transfer.driver}
        className="dispatcher-driver-avatar"
      />
    ) : (
      <div className="dispatcher-driver-initials">
        {getInitials(transfer.driver)}
      </div>
    )}

    <div>
      <strong>{transfer.driver}</strong>

      <small
        className={`operation-badge ${
          operationSummary.driver_status ||
          "waiting"
        }`}
      >
        {getDriverStatusLabel(
          operationSummary.driver_status
        )}
      </small>
    </div>

  </div>
</div>

        <div className="dispatcher-vehicle-card">
  <span>Araç</span>

  {vehicle?.photo_url ? (
    <img
      src={vehicle.photo_url}
      alt={vehicle.plate}
      className="dispatcher-vehicle-photo"
    />
  ) : (
    <div className="dispatcher-vehicle-placeholder">
      🚐
    </div>
  )}

  <strong>
    {vehicle
      ? `${vehicle.brand} ${vehicle.model}`
      : "Araç atanmamış"}
  </strong>

  {vehicle?.plate && (
    <small className="dispatcher-vehicle-plate">
      {vehicle.plate}
    </small>
  )}

  <small
    className={`operation-badge ${
      operationSummary.vehicle_status ||
      "unassigned"
    }`}
  >
    {getVehicleStatusLabel(
      operationSummary.vehicle_status,
    )}
  </small>
</div>

        <div>
          <span>Yolcu</span>
          <strong>{transfer.passenger}</strong>
        </div>

        <div>
          <span>Uçuş</span>
          <strong>{transfer.flight}</strong>
        </div>

        <div>
          <span>Rezervasyon</span>
          <strong>#{transfer.id}</strong>
        </div>
      </div>

      <section className="dispatcher-operation-summary">
        <DispatcherGpsStatus
  lastGpsAt={operationSummary.last_gps_at}
/>
        <div>
          <span>Bugünkü Transfer</span>

          <strong>
            {Number(
              operationSummary.today_transfer_count ||
                0,
            )}
          </strong>
        </div>

        <div>
          <span>Tamamlanan</span>

          <strong>
            {Number(
              operationSummary.today_completed_count ||
                0,
            )}
          </strong>
        </div>
      </section>

      <div className="dispatcher-transfer-actions">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onViewDetail?.(transfer);
          }}
        >
          Detayı Gör
        </button>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();

            if (!transfer.driver_phone) {
              alert(
                "Sürücü telefon numarası bulunamadı.",
              );
              return;
            }

            window.location.href =
              `tel:${transfer.driver_phone}`;
          }}
        >
          Sürücüyü Ara
        </button>
      </div>
    </article>
  );
}

function getStatusLabel(status) {
  const labels = {
    pending: "Bekliyor",
    accepted: "Kabul Edildi",
    on_the_way: "Yola Çıkıldı",
    arrived: "Alış Noktasında",
    passenger_called: "Yolcu Arandı",
    passenger_on_board: "Yolcu Geldi",
    trip_started: "Yolculuk Başladı",
    completed: "Tamamlandı",
    no_show: "No Show",
  };

  return labels[status] || status;
}

function getDriverStatusLabel(status) {
  const labels = {
    on_duty: "Görevde",
    available: "Müsait",
    waiting: "Bekliyor",
  };

  return labels[status] || "Bilinmiyor";
}

function getVehicleStatusLabel(status) {
  const labels = {
    active: "Aktif",
    service: "Serviste",
    faulty: "Arızalı",
    inactive: "Pasif",
    unassigned: "Araç Yok",
  };

  return labels[status] || "Bilinmiyor";
}

function formatGpsTime(value) {
  if (!value) {
    return "--:--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeAgo(value) {
  if (!value) {
    return "Konum yok";
  }

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return "Zaman bilgisi yok";
  }

  const seconds = Math.max(
    0,
    Math.floor(
      (Date.now() - timestamp) / 1000,
    ),
  );

  if (seconds < 10) {
    return "Şimdi";
  }

  if (seconds < 60) {
    return `${seconds} sn önce`;
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} dk önce`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} saat önce`;
  }

  const days = Math.floor(hours / 24);

  return `${days} gün önce`;
}
function getInitials(name) {
  if (!name) return "?";

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}
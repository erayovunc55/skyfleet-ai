export default function DriverTransferCard({
  transfer,
  onOpen,
}) {
  return (
    <button
      className="driver-transfer-card"
      type="button"
      onClick={() => onOpen(transfer)}
    >
      <div className="driver-transfer-card-top">
        <div>
          <span>
            {formatPickupDate(
              transfer.pickup_time,
            )}
          </span>

          <strong>
            {formatPickupTime(
              transfer.pickup_time,
            )}
          </strong>
        </div>

        <span
          className={`driver-status-pill driver-status-${transfer.status}`}
        >
          {getStatusLabel(transfer.status)}
        </span>
      </div>

      <div className="driver-transfer-reference">
        {transfer.booking_reference ||
          `#${transfer.id}`}
      </div>

      <h2>
        {getPickupLabel(transfer)}
        <span>→</span>
        {getDropoffLabel(transfer)}
      </h2>

      <div className="driver-transfer-passenger">
        <span>Yolcu</span>

        <strong>
          {transfer.passenger_name ||
            "Belirtilmedi"}
        </strong>
      </div>

      <div className="driver-transfer-meta">
        <span>
          ✈{" "}
          {transfer.flight_number ||
            "Uçuş yok"}
        </span>

        <span>
          👥{" "}
          {getPassengerCount(transfer)}
        </span>

        <span>
          🧳{" "}
          {Number(
            transfer.luggage_count || 0,
          )}
        </span>
      </div>

      <div className="driver-transfer-open">
        Transferi Aç
        <span>→</span>
      </div>
    </button>
  );
}

function getPickupLabel(transfer) {
  return (
    transfer.pickup_location?.code ||
    transfer.pickup_location?.name ||
    transfer.pickup ||
    "Alış noktası"
  );
}

function getDropoffLabel(transfer) {
  return (
    transfer.dropoff_location?.code ||
    transfer.dropoff_location?.name ||
    transfer.dropoff ||
    "Bırakış noktası"
  );
}

function getPassengerCount(transfer) {
  return (
    Number(transfer.adult || 0) +
    Number(transfer.child || 0) +
    Number(transfer.baby || 0)
  );
}

function formatPickupDate(value) {
  if (!value) {
    return "Tarih yok";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Tarih yok";
  }

  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
  });
}

function formatPickupTime(value) {
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
    cancelled: "İptal Edildi",
  };

  return labels[status] || status;
}
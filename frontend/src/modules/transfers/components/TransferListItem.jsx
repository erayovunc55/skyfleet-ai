import {
  StatusBadge,
} from "../../../components/ui";

export default function TransferListItem({
  transfer,
  active = false,
  onClick,
}) {
  return (
    <button
      className={
        active
          ? "transfer-list-item active"
          : "transfer-list-item"
      }
      type="button"
      onClick={onClick}
    >
      <div className="transfer-list-item-top">
        <div>
          <strong>
            {transfer.booking_reference ||
              `#${transfer.id}`}
          </strong>

          <span>
            {formatPickupTime(
              transfer.pickup_time,
            )}
          </span>
        </div>

        <StatusBadge
          status={transfer.status}
        />
      </div>

      <div className="transfer-list-item-passenger">
        {transfer.passenger_name ||
          "Yolcu belirtilmedi"}
      </div>

      <div className="transfer-list-item-route">
        <span>
          {getPickupLabel(transfer)}
        </span>

        <span className="transfer-list-item-arrow">
          →
        </span>

        <span>
          {getDropoffLabel(transfer)}
        </span>
      </div>

      <div className="transfer-list-item-footer">
        <span>
          {transfer.flight_number ||
            "Uçuş yok"}
        </span>

        <span>
          {transfer.driver?.name ||
            "Sürücü atanmamış"}
        </span>
      </div>
    </button>
  );
}

function getPickupLabel(transfer) {
  return (
    transfer.pickup_location?.code ||
    transfer.pickup_location?.name ||
    transfer.pickup ||
    "Alış noktası yok"
  );
}

function getDropoffLabel(transfer) {
  return (
    transfer.dropoff_location?.code ||
    transfer.dropoff_location?.name ||
    transfer.dropoff ||
    "Bırakış noktası yok"
  );
}

function formatPickupTime(value) {
  if (!value) {
    return "--:--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return date.toLocaleTimeString(
    "tr-TR",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}
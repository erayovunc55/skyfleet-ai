import {
  Avatar,
  Card,
  StatusBadge,
} from "../../../components/ui";

import useTransfer from "../hooks/useTransfer";

export default function DriverCard() {
  const { selectedTransfer } = useTransfer();

  const driver = selectedTransfer?.driver;

  if (!selectedTransfer) {
    return null;
  }

  if (!driver) {
    return (
      <Card
        title="Sürücü"
        subtitle="Sürücü bilgileri"
      >
        <div className="transfer-card-empty">
          Bu transfere sürücü atanmamış.
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Sürücü"
      subtitle="Atanan sürücü"
    >
      <div className="driver-card-header">
        <Avatar
          name={driver.name}
          image={
            driver.avatar_url ||
            driver.photo_url ||
            ""
          }
          size="lg"
        />

        <div>
          <strong>{driver.name}</strong>

          <small>
            {driver.phone ||
              "Telefon bilgisi yok"}
          </small>
        </div>
      </div>

      <div className="info-row">
        <span>Tedarikçi</span>
        <strong>
          {driver.supplier ||
            selectedTransfer.supplier ||
            "Belirtilmedi"}
        </strong>
      </div>

      <div className="info-row">
        <span>Durum</span>

        <StatusBadge
          status={
            selectedTransfer
              .operation_summary
              ?.driver_status ||
            (driver.is_active
              ? "active"
              : "inactive")
          }
        />
      </div>
    </Card>
  );
}
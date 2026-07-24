export default function DriverSelector({
  vehicle,
  drivers,
  isUpdating,
  onAssign,
}) {
  const assignedDriver =
    drivers.find(
      (driver) =>
        Number(driver.vehicle_id) ===
        Number(vehicle.id),
    ) || null;

  return (
    <div className="driver-selector">
      <label>
        Atanan Sürücü

        <select
          value={assignedDriver?.id || ""}
          disabled={isUpdating}
          onChange={(event) =>
            onAssign(
              vehicle,
              event.target.value
                ? Number(event.target.value)
                : null,
            )
          }
        >
          <option value="">
            Sürücü seçiniz
          </option>

          {drivers.map((driver) => (
            <option
              key={driver.id}
              value={driver.id}
            >
              {driver.name}
            </option>
          ))}
        </select>
      </label>

      {assignedDriver && (
        <div className="driver-selector-info">
          <strong>
            {assignedDriver.name}
          </strong>

          <small>
            {assignedDriver.phone ||
              "Telefon bilgisi yok"}
          </small>
        </div>
      )}

      {isUpdating && (
        <small>
          Güncelleniyor...
        </small>
      )}
    </div>
  );
}
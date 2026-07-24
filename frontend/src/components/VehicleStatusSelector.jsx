export default function VehicleStatusSelector({
  vehicle,
  status,
  isUpdating,
  onChange,
}) {
  return (
    <div className="vehicle-status-actions">
      <label>
        Araç Durumu

        <select
          value={status}
          disabled={isUpdating}
          onChange={(event) =>
            onChange(vehicle, event.target.value)
          }
        >
          <option value="active">
            Aktif
          </option>

          <option value="service">
            Serviste
          </option>

          <option value="faulty">
            Arızalı
          </option>

          <option value="inactive">
            Pasif
          </option>
        </select>
      </label>

      {isUpdating && (
        <small>
          Durum güncelleniyor...
        </small>
      )}
    </div>
  );
}
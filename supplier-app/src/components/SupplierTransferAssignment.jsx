import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  assignSupplierTransfer,
  getSupplierDrivers,
  getSupplierVehicles,
  unassignSupplierTransfer,
} from "../services/supplierService";

export default function SupplierTransferAssignment({
  transfer,
  onAssigned,
}) {
  const [drivers, setDrivers] =
    useState([]);

  const [vehicles, setVehicles] =
    useState([]);

  const [
    selectedDriverId,
    setSelectedDriverId,
  ] = useState("");

  const [
    selectedVehicleId,
    setSelectedVehicleId,
  ] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const canAssign = [
    "pending",
    "accepted",
  ].includes(
    transfer?.status,
  );

  useEffect(() => {
    setSelectedDriverId(
      transfer?.driver_id
        ? String(
            transfer.driver_id,
          )
        : "",
    );

    setSelectedVehicleId(
      transfer?.assigned_vehicle_id
        ? String(
            transfer.assigned_vehicle_id,
          )
        : transfer?.driver
            ?.vehicle_id
          ? String(
              transfer.driver
                .vehicle_id,
            )
          : "",
    );

    setError("");
    setMessage("");
  }, [
    transfer?.id,
    transfer?.driver_id,
    transfer?.assigned_vehicle_id,
    transfer?.driver?.vehicle_id,
  ]);

  useEffect(() => {
    let active = true;

    async function loadResources() {
      setLoading(true);
      setError("");

      try {
        const [
          driverData,
          vehicleData,
        ] = await Promise.all([
          getSupplierDrivers(),
          getSupplierVehicles(),
        ]);

        if (active) {
          setDrivers(
            driverData.filter(
              (driver) =>
                driver.is_active,
            ),
          );

          setVehicles(
            vehicleData.filter(
              (vehicle) =>
                vehicle.is_active &&
                vehicle
                  .operational_status ===
                  "active",
            ),
          );
        }
      } catch (requestError) {
        if (active) {
          setError(
            getErrorMessage(
              requestError,
              "Sürücü ve araç bilgileri yüklenemedi.",
            ),
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadResources();

    return () => {
      active = false;
    };
  }, []);

  const selectedDriver =
    useMemo(
      () =>
        drivers.find(
          (driver) =>
            Number(driver.id) ===
            Number(
              selectedDriverId,
            ),
        ) || null,
      [
        drivers,
        selectedDriverId,
      ],
    );

  function handleDriverChange(
    driverId,
  ) {
    setSelectedDriverId(
      driverId,
    );

    const driver =
      drivers.find(
        (item) =>
          Number(item.id) ===
          Number(driverId),
      );

    if (driver?.vehicle_id) {
      setSelectedVehicleId(
        String(
          driver.vehicle_id,
        ),
      );
    }
  }

  async function handleAssign() {
    if (
      !transfer?.id ||
      !canAssign
    ) {
      return;
    }

    if (!selectedDriverId) {
      setError(
        "Sürücü seçmelisiniz.",
      );

      return;
    }

    if (!selectedVehicleId) {
      setError(
        "Araç seçmelisiniz.",
      );

      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const updatedTransfer =
        await assignSupplierTransfer(
          transfer.id,
          selectedDriverId,
          selectedVehicleId,
        );

      setMessage(
        "Transfer sürücü ve araca atandı.",
      );

      onAssigned?.(
        updatedTransfer,
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Transfer ataması kaydedilemedi.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUnassign() {
    if (
      !transfer?.id ||
      !canAssign
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Transferin sürücü ve araç ataması kaldırılsın mı?",
      );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const updatedTransfer =
        await unassignSupplierTransfer(
          transfer.id,
        );

      setSelectedDriverId("");
      setSelectedVehicleId("");

      setMessage(
        "Transfer ataması kaldırıldı.",
      );

      onAssigned?.(
        updatedTransfer,
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Transfer ataması kaldırılamadı.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  if (!transfer) {
    return null;
  }

  return (
    <section className="supplier-assignment-card">
      <div className="supplier-assignment-heading">
        <div>
          <span className="supplier-eyebrow">
            OPERASYON ATAMASI
          </span>

          <h3>
            Sürücü ve Araç
          </h3>
        </div>

        <span
          className={
            transfer.driver_id
              ? "supplier-assignment-state assigned"
              : "supplier-assignment-state"
          }
        >
          {transfer.driver_id
            ? "Atandı"
            : "Atanmadı"}
        </span>
      </div>

      {transfer.driver && (
        <div className="supplier-current-assignment">
          <div>
            <span>
              Mevcut sürücü
            </span>

            <strong>
              {transfer.driver.name}
            </strong>

            <small>
              {transfer.driver.phone ||
                "Telefon belirtilmedi"}
            </small>
          </div>

          <div>
            <span>
              Mevcut araç
            </span>

            <strong>
              {transfer
                .assigned_vehicle
                ?.plate ||
                transfer.driver
                  ?.vehicle?.plate ||
                "Araç atanmadı"}
            </strong>

            <small>
              {transfer
                .assigned_vehicle
                ? `${
                    transfer
                      .assigned_vehicle
                      .brand || ""
                  } ${
                    transfer
                      .assigned_vehicle
                      .model || ""
                  }`.trim()
                : transfer.driver
                    ?.vehicle
                  ? `${
                      transfer.driver
                        .vehicle
                        .brand || ""
                    } ${
                      transfer.driver
                        .vehicle
                        .model || ""
                    }`.trim()
                  : ""}
            </small>
          </div>
        </div>
      )}

      <div className="supplier-assignment-form">
        <label>
          <span>Sürücü</span>

          <select
            value={
              selectedDriverId
            }
            disabled={
              loading ||
              saving ||
              !canAssign
            }
            onChange={(event) =>
              handleDriverChange(
                event.target.value,
              )
            }
          >
            <option value="">
              Sürücü seçin
            </option>

            {drivers.map(
              (driver) => (
                <option
                  key={driver.id}
                  value={driver.id}
                >
                  {driver.name}
                  {driver.phone
                    ? ` — ${driver.phone}`
                    : ""}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          <span>Araç</span>

          <select
            value={
              selectedVehicleId
            }
            disabled={
              loading ||
              saving ||
              !canAssign
            }
            onChange={(event) =>
              setSelectedVehicleId(
                event.target.value,
              )
            }
          >
            <option value="">
              Araç seçin
            </option>

            {vehicles.map(
              (vehicle) => (
                <option
                  key={vehicle.id}
                  value={vehicle.id}
                >
                  {vehicle.plate}
                  {" — "}
                  {vehicle.brand}
                  {" "}
                  {vehicle.model}
                </option>
              ),
            )}
          </select>
        </label>
      </div>

      {selectedDriver &&
        selectedDriver.vehicle_id &&
        Number(
          selectedDriver.vehicle_id,
        ) !==
          Number(
            selectedVehicleId,
          ) && (
          <div className="supplier-assignment-info">
            Seçilen araç sürücünün mevcut
            aracının yerine atanacaktır.
          </div>
        )}

      {loading && (
        <div className="supplier-assignment-info">
          Sürücü ve araçlar yükleniyor...
        </div>
      )}

      {!loading &&
        drivers.length === 0 && (
          <div className="supplier-assignment-info warning">
            Atama yapabilmek için önce
            aktif bir sürücü eklemelisiniz.
          </div>
        )}

      {!loading &&
        vehicles.length === 0 && (
          <div className="supplier-assignment-info warning">
            Atama yapabilmek için önce
            aktif bir araç eklemelisiniz.
          </div>
        )}

      {!canAssign && (
        <div className="supplier-assignment-info warning">
          Operasyonu başlamış veya kapanmış
          transferin ataması değiştirilemez.
        </div>
      )}

      {error && (
        <div className="supplier-message error">
          {error}
        </div>
      )}

      {message && (
        <div className="supplier-message success">
          {message}
        </div>
      )}

      <div className="supplier-assignment-actions">
        {transfer.driver_id && (
          <button
            className="supplier-secondary-button supplier-unassign-button"
            type="button"
            disabled={
              saving ||
              !canAssign
            }
            onClick={
              handleUnassign
            }
          >
            Atamayı Kaldır
          </button>
        )}

        <button
          className="supplier-primary-button"
          type="button"
          disabled={
            loading ||
            saving ||
            !canAssign ||
            !selectedDriverId ||
            !selectedVehicleId
          }
          onClick={
            handleAssign
          }
        >
          {saving
            ? "Kaydediliyor..."
            : transfer.driver_id
              ? "Atamayı Güncelle"
              : "Transferi Ata"}
        </button>
      </div>
    </section>
  );
}

function getErrorMessage(
  error,
  fallback,
) {
  const validationErrors =
    error?.response?.data?.errors;

  if (validationErrors) {
    const firstError =
      Object.values(
        validationErrors,
      )?.[0]?.[0];

    if (firstError) {
      return firstError;
    }
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}
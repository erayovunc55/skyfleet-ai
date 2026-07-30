import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Button,
  Card,
  StatusBadge,
} from "../../../components/ui";

import apiClient from "../../../services/apiClient";
import useTransfer from "../hooks/useTransfer";

export default function AssignmentCard() {
  const {
    selectedTransfer,
    updateSelectedTransfer,
  } = useTransfer();

  const [drivers, setDrivers] = useState([]);
  const [driverId, setDriverId] = useState("");
  const [loadingDrivers, setLoadingDrivers] =
    useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setDriverId(
      selectedTransfer?.driver?.id
        ? String(selectedTransfer.driver.id)
        : "",
    );
  }, [selectedTransfer]);

  useEffect(() => {
    let cancelled = false;

    async function loadDrivers() {
      setLoadingDrivers(true);
      setError("");

      try {
        const response = await apiClient.get(
          "/drivers",
        );

        if (!cancelled) {
          setDrivers(
            Array.isArray(response.data?.data)
              ? response.data.data
              : [],
          );
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError?.response?.data?.message ||
              "Sürücü listesi alınamadı.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingDrivers(false);
        }
      }
    }

    loadDrivers();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedDriver = useMemo(
    () =>
      drivers.find(
        (driver) =>
          Number(driver.id) ===
          Number(driverId),
      ) || null,
    [drivers, driverId],
  );

  if (!selectedTransfer) {
    return null;
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await apiClient.patch(
        `/transfers/${selectedTransfer.id}/assignment`,
        {
          driver_id: driverId
            ? Number(driverId)
            : null,
        },
      );

      const updatedTransfer =
        response.data?.data || {};

      updateSelectedTransfer({
        ...updatedTransfer,
        driver:
          updatedTransfer.driver ||
          selectedDriver ||
          null,
      });

      setMessage(
        response.data?.message ||
          "Atama başarıyla güncellendi.",
      );
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Atama kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card
      title="Operasyon Ataması"
      subtitle="Sürücü ve araç yönetimi"
      actions={
        selectedTransfer.driver ? (
          <StatusBadge
            status={
              selectedTransfer
                .operation_summary
                ?.driver_status ||
              "active"
            }
          />
        ) : null
      }
    >
      <div className="assignment-field">
        <label htmlFor="assignment-driver">
          Sürücü
        </label>

        <select
          id="assignment-driver"
          value={driverId}
          disabled={loadingDrivers || saving}
          onChange={(event) => {
            setDriverId(event.target.value);
            setError("");
            setMessage("");
          }}
        >
          <option value="">
            {loadingDrivers
              ? "Sürücüler yükleniyor..."
              : "Sürücü atamasını kaldır"}
          </option>

          {drivers.map((driver) => (
            <option
              key={driver.id}
              value={driver.id}
            >
              {driver.name}
              {driver.vehicle
                ? ` — ${driver.vehicle.plate}`
                : " — Araç yok"}
            </option>
          ))}
        </select>
      </div>

      {selectedDriver?.vehicle && (
        <div className="assignment-vehicle-preview">
          <span>Atanacak araç</span>

          <strong>
            {selectedDriver.vehicle.brand}{" "}
            {selectedDriver.vehicle.model}
          </strong>

          <small>
            {selectedDriver.vehicle.plate}
          </small>
        </div>
      )}

      {error && (
        <div className="assignment-message error">
          {error}
        </div>
      )}

      {message && (
        <div className="assignment-message success">
          {message}
        </div>
      )}

      <Button
        variant="primary"
        loading={saving}
        onClick={handleSave}
      >
        {driverId
          ? "Atamayı Kaydet"
          : "Atamayı Kaldır"}
      </Button>
    </Card>
  );
}
import { useEffect, useMemo, useState } from "react";
import { Button, Card, StatusBadge } from "../../../components/ui";
import { useLanguage } from "../../../i18n";
import apiClient from "../../../services/apiClient";
import useTransfer from "../hooks/useTransfer";

const TEXT = {
  tr: {
    title: "Operasyon Ataması",
    subtitle: "Sürücü ve araç yönetimi",
    driver: "Sürücü",
    loading: "Sürücüler yükleniyor...",
    selectDriver: "Sürücü seçin",
    removeDriver: "Sürücü atamasını kaldır",
    noVehicle: "Araç yok",
    assignedVehicle: "Atanacak araç",
    save: "Atamayı Kaydet",
    assign: "Sürücü Ata",
    remove: "Atamayı Kaldır",
    listError: "Sürücü listesi alınamadı.",
    success: "Atama başarıyla güncellendi.",
    saveError: "Atama kaydedilemedi.",
  },
  en: {
    title: "Operation Assignment",
    subtitle: "Driver & vehicle management",
    driver: "Driver",
    loading: "Loading drivers...",
    selectDriver: "Select driver",
    removeDriver: "Remove driver assignment",
    noVehicle: "No vehicle",
    assignedVehicle: "Vehicle to be assigned",
    save: "Save Assignment",
    assign: "Assign Driver",
    remove: "Remove Assignment",
    listError: "Driver list could not be loaded.",
    success: "Assignment updated successfully.",
    saveError: "Assignment could not be saved.",
  },
  ar: {
    title: "تعيين العملية",
    subtitle: "إدارة السائق والمركبة",
    driver: "السائق",
    loading: "جارٍ تحميل السائقين...",
    selectDriver: "اختر السائق",
    removeDriver: "إزالة تعيين السائق",
    noVehicle: "لا توجد مركبة",
    assignedVehicle: "المركبة التي سيتم تعيينها",
    save: "حفظ التعيين",
    assign: "تعيين السائق",
    remove: "إزالة التعيين",
    listError: "تعذر تحميل قائمة السائقين.",
    success: "تم تحديث التعيين بنجاح.",
    saveError: "تعذر حفظ التعيين.",
  },
  es: {
    title: "Asignación de operación",
    subtitle: "Gestión de conductor y vehículo",
    driver: "Conductor",
    loading: "Cargando conductores...",
    selectDriver: "Seleccionar conductor",
    removeDriver: "Quitar asignación del conductor",
    noVehicle: "Sin vehículo",
    assignedVehicle: "Vehículo a asignar",
    save: "Guardar asignación",
    assign: "Asignar conductor",
    remove: "Quitar asignación",
    listError: "No se pudo cargar la lista de conductores.",
    success: "Asignación actualizada correctamente.",
    saveError: "No se pudo guardar la asignación.",
  },
};

export default function AssignmentCard() {
  const { language } = useLanguage();
  const text = TEXT[language] || TEXT.en;
  const { selectedTransfer, updateSelectedTransfer } = useTransfer();
  const [drivers, setDrivers] = useState([]);
  const [driverId, setDriverId] = useState("");
  const [loadingDrivers, setLoadingDrivers] = useState(false);
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
        const response = await apiClient.get("/drivers");
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
              text.listError,
          );
        }
      } finally {
        if (!cancelled) setLoadingDrivers(false);
      }
    }

    loadDrivers();
    return () => {
      cancelled = true;
    };
  }, [text.listError]);

  const selectedDriver = useMemo(
    () =>
      drivers.find(
        (driver) => Number(driver.id) === Number(driverId),
      ) || null,
    [drivers, driverId],
  );

  if (!selectedTransfer) return null;

  const hasAssignedDriver = Boolean(selectedTransfer.driver?.id);
  const isRemovingAssignment = hasAssignedDriver && !driverId;
  const isEmptyUnassignedState = !hasAssignedDriver && !driverId;

  async function handleSave() {
    if (isEmptyUnassignedState) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await apiClient.patch(
        `/transfers/${selectedTransfer.id}/assignment`,
        {
          driver_id: driverId ? Number(driverId) : null,
        },
      );

      const updatedTransfer = response.data?.data || {};

      updateSelectedTransfer({
        ...updatedTransfer,
        driver:
          updatedTransfer.driver ||
          selectedDriver ||
          null,
      });

      setMessage(response.data?.message || text.success);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          text.saveError,
      );
    } finally {
      setSaving(false);
    }
  }

  const emptyOptionLabel = loadingDrivers
    ? text.loading
    : hasAssignedDriver
      ? text.removeDriver
      : text.selectDriver;

  const actionLabel = isRemovingAssignment
    ? text.remove
    : hasAssignedDriver
      ? text.save
      : text.assign;

  return (
    <Card
      title={text.title}
      subtitle={text.subtitle}
      actions={
        hasAssignedDriver ? (
          <StatusBadge
            status={
              selectedTransfer.operation_summary?.driver_status ||
              "active"
            }
          />
        ) : null
      }
    >
      <div className="assignment-field">
        <label htmlFor="assignment-driver">{text.driver}</label>

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
          <option value="">{emptyOptionLabel}</option>

          {drivers.map((driver) => (
            <option key={driver.id} value={driver.id}>
              {driver.name}
              {driver.vehicle
                ? ` — ${driver.vehicle.plate}`
                : ` — ${text.noVehicle}`}
            </option>
          ))}
        </select>
      </div>

      {selectedDriver?.vehicle && (
        <div className="assignment-vehicle-preview">
          <span>{text.assignedVehicle}</span>
          <strong>
            {selectedDriver.vehicle.brand}{" "}
            {selectedDriver.vehicle.model}
          </strong>
          <small>{selectedDriver.vehicle.plate}</small>
        </div>
      )}

      {error && (
        <div className="assignment-message error">{error}</div>
      )}

      {message && (
        <div className="assignment-message success">
          {message}
        </div>
      )}

      <Button
        variant={isRemovingAssignment ? "danger" : "primary"}
        loading={saving}
        disabled={isEmptyUnassignedState || loadingDrivers}
        onClick={handleSave}
      >
        {actionLabel}
      </Button>
    </Card>
  );
}

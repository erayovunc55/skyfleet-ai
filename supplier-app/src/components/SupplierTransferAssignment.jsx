import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useLanguage } from "../i18n";

import {
  assignSupplierTransfer,
  getSupplierDrivers,
  getSupplierVehicles,
  unassignSupplierTransfer,
} from "../services/supplierService";

const TEXT = {
  tr: {
    loadError:
      "Sürücü ve araç bilgileri yüklenemedi.",
    selectDriverError:
      "Sürücü seçmelisiniz.",
    selectVehicleError:
      "Araç seçmelisiniz.",
    assignedSuccess:
      "Transfer sürücü ve araca atandı.",
    assignError:
      "Transfer ataması kaydedilemedi.",
    unassignConfirm:
      "Transferin sürücü ve araç ataması kaldırılsın mı?",
    unassignedSuccess:
      "Transfer ataması kaldırıldı.",
    unassignError:
      "Transfer ataması kaldırılamadı.",

    eyebrow: "OPERASYON ATAMASI",
    title: "Sürücü ve Araç",
    assigned: "Atandı",
    unassigned: "Atanmadı",

    currentDriver: "Mevcut sürücü",
    currentVehicle: "Mevcut araç",
    phoneNotSpecified:
      "Telefon belirtilmedi",
    vehicleNotAssigned:
      "Araç atanmadı",

    driver: "Sürücü",
    vehicle: "Araç",
    selectDriver: "Sürücü seçin",
    selectVehicle: "Araç seçin",

    vehicleOverride:
      "Seçilen araç sürücünün mevcut aracının yerine atanacaktır.",

    loading:
      "Sürücü ve araçlar yükleniyor...",

    noDrivers:
      "Atama yapabilmek için önce aktif bir sürücü eklemelisiniz.",

    noVehicles:
      "Atama yapabilmek için önce aktif bir araç eklemelisiniz.",

    cannotAssign:
      "Operasyonu başlamış veya kapanmış transferin ataması değiştirilemez.",

    removeAssignment:
      "Atamayı Kaldır",
    saving:
      "Kaydediliyor...",
    updateAssignment:
      "Atamayı Güncelle",
    assignTransfer:
      "Transferi Ata",
  },

  en: {
    loadError:
      "Driver and vehicle information could not be loaded.",
    selectDriverError:
      "Please select a driver.",
    selectVehicleError:
      "Please select a vehicle.",
    assignedSuccess:
      "The transfer has been assigned to the driver and vehicle.",
    assignError:
      "The transfer assignment could not be saved.",
    unassignConfirm:
      "Remove the driver and vehicle assignment from this transfer?",
    unassignedSuccess:
      "The transfer assignment has been removed.",
    unassignError:
      "The transfer assignment could not be removed.",

    eyebrow: "OPERATION ASSIGNMENT",
    title: "Driver and Vehicle",
    assigned: "Assigned",
    unassigned: "Unassigned",

    currentDriver: "Current driver",
    currentVehicle: "Current vehicle",
    phoneNotSpecified:
      "Phone not specified",
    vehicleNotAssigned:
      "Vehicle not assigned",

    driver: "Driver",
    vehicle: "Vehicle",
    selectDriver: "Select driver",
    selectVehicle: "Select vehicle",

    vehicleOverride:
      "The selected vehicle will replace the driver's current vehicle for this transfer.",

    loading:
      "Loading drivers and vehicles...",

    noDrivers:
      "Add an active driver before assigning this transfer.",

    noVehicles:
      "Add an active vehicle before assigning this transfer.",

    cannotAssign:
      "The assignment cannot be changed after the operation has started or closed.",

    removeAssignment:
      "Remove Assignment",
    saving:
      "Saving...",
    updateAssignment:
      "Update Assignment",
    assignTransfer:
      "Assign Transfer",
  },

  es: {
    loadError:
      "No se pudo cargar la información de conductores y vehículos.",
    selectDriverError:
      "Seleccione un conductor.",
    selectVehicleError:
      "Seleccione un vehículo.",
    assignedSuccess:
      "El traslado ha sido asignado al conductor y al vehículo.",
    assignError:
      "No se pudo guardar la asignación del traslado.",
    unassignConfirm:
      "¿Desea eliminar la asignación del conductor y vehículo de este traslado?",
    unassignedSuccess:
      "La asignación del traslado ha sido eliminada.",
    unassignError:
      "No se pudo eliminar la asignación del traslado.",

    eyebrow: "ASIGNACIÓN OPERATIVA",
    title: "Conductor y Vehículo",
    assigned: "Asignado",
    unassigned: "Sin asignar",

    currentDriver: "Conductor actual",
    currentVehicle: "Vehículo actual",
    phoneNotSpecified:
      "Teléfono no especificado",
    vehicleNotAssigned:
      "Vehículo no asignado",

    driver: "Conductor",
    vehicle: "Vehículo",
    selectDriver: "Seleccionar conductor",
    selectVehicle: "Seleccionar vehículo",

    vehicleOverride:
      "El vehículo seleccionado sustituirá al vehículo actual del conductor para este traslado.",

    loading:
      "Cargando conductores y vehículos...",

    noDrivers:
      "Añada un conductor activo antes de asignar este traslado.",

    noVehicles:
      "Añada un vehículo activo antes de asignar este traslado.",

    cannotAssign:
      "La asignación no puede modificarse una vez iniciada o cerrada la operación.",

    removeAssignment:
      "Eliminar Asignación",
    saving:
      "Guardando...",
    updateAssignment:
      "Actualizar Asignación",
    assignTransfer:
      "Asignar Traslado",
  },

  ar: {
    loadError:
      "تعذر تحميل معلومات السائقين والمركبات.",
    selectDriverError:
      "يرجى اختيار سائق.",
    selectVehicleError:
      "يرجى اختيار مركبة.",
    assignedSuccess:
      "تم تعيين الرحلة للسائق والمركبة.",
    assignError:
      "تعذر حفظ تعيين الرحلة.",
    unassignConfirm:
      "هل تريد إزالة تعيين السائق والمركبة من هذه الرحلة؟",
    unassignedSuccess:
      "تمت إزالة تعيين الرحلة.",
    unassignError:
      "تعذر إزالة تعيين الرحلة.",

    eyebrow: "تعيين العملية",
    title: "السائق والمركبة",
    assigned: "تم التعيين",
    unassigned: "غير معين",

    currentDriver: "السائق الحالي",
    currentVehicle: "المركبة الحالية",
    phoneNotSpecified:
      "رقم الهاتف غير محدد",
    vehicleNotAssigned:
      "لم يتم تعيين مركبة",

    driver: "السائق",
    vehicle: "المركبة",
    selectDriver: "اختر السائق",
    selectVehicle: "اختر المركبة",

    vehicleOverride:
      "ستحل المركبة المحددة محل المركبة الحالية للسائق لهذه الرحلة.",

    loading:
      "جارٍ تحميل السائقين والمركبات...",

    noDrivers:
      "أضف سائقاً نشطاً قبل تعيين هذه الرحلة.",

    noVehicles:
      "أضف مركبة نشطة قبل تعيين هذه الرحلة.",

    cannotAssign:
      "لا يمكن تغيير التعيين بعد بدء العملية أو إغلاقها.",

    removeAssignment:
      "إزالة التعيين",
    saving:
      "جارٍ الحفظ...",
    updateAssignment:
      "تحديث التعيين",
    assignTransfer:
      "تعيين الرحلة",
  },
};

export default function SupplierTransferAssignment({
  transfer,
  onAssigned,
}) {
  const { language } = useLanguage();

  const t =
    TEXT[language] ||
    TEXT.en;

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
      transfer
        ?.assigned_vehicle_id
        ? String(
            transfer
              .assigned_vehicle_id,
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
              t.loadError,
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
  }, [t.loadError]);

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
        t.selectDriverError,
      );

      return;
    }

    if (!selectedVehicleId) {
      setError(
        t.selectVehicleError,
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
        t.assignedSuccess,
      );

      onAssigned?.(
        updatedTransfer,
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          t.assignError,
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
        t.unassignConfirm,
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
        t.unassignedSuccess,
      );

      onAssigned?.(
        updatedTransfer,
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          t.unassignError,
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
            {t.eyebrow}
          </span>

          <h3>
            {t.title}
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
            ? t.assigned
            : t.unassigned}
        </span>
      </div>

      {transfer.driver && (
        <div className="supplier-current-assignment">
          <div>
            <span>
              {t.currentDriver}
            </span>

            <strong>
              {transfer.driver.name}
            </strong>

            <small>
              {transfer.driver.phone ||
                t.phoneNotSpecified}
            </small>
          </div>

          <div>
            <span>
              {t.currentVehicle}
            </span>

            <strong>
              {transfer
                .assigned_vehicle
                ?.plate ||
                transfer.driver
                  ?.vehicle?.plate ||
                t.vehicleNotAssigned}
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
          <span>
            {t.driver}
          </span>

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
              {t.selectDriver}
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
          <span>
            {t.vehicle}
          </span>

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
              {t.selectVehicle}
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
            {t.vehicleOverride}
          </div>
        )}

      {loading && (
        <div className="supplier-assignment-info">
          {t.loading}
        </div>
      )}

      {!loading &&
        drivers.length === 0 && (
          <div className="supplier-assignment-info warning">
            {t.noDrivers}
          </div>
        )}

      {!loading &&
        vehicles.length === 0 && (
          <div className="supplier-assignment-info warning">
            {t.noVehicles}
          </div>
        )}

      {!canAssign && (
        <div className="supplier-assignment-info warning">
          {t.cannotAssign}
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
            {t.removeAssignment}
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
            ? t.saving
            : transfer.driver_id
              ? t.updateAssignment
              : t.assignTransfer}
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
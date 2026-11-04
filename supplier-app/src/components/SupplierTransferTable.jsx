import { useEffect, useMemo, useState } from "react";

import { useLanguage } from "../i18n";
import {
  assignSupplierTransfer,
  getSupplierDrivers,
  getSupplierVehicles,
  unassignSupplierTransfer,
} from "../services/supplierService";

const TEXT = {
  tr: {
    date: "Tarih",
    time: "Saat",
    flight: "Uçuş",
    from: "Nereden",
    to: "Nereye",
    name: "İsim",
    pax: "Kişi",
    vehicleType: "Araç Tipi",
    plate: "Plaka",
    driver: "Şoför",
    notes: "Notlar",
    amount: "Tutar",
    status: "Durum",
    choose: "Seçin",
    clear: "Atamayı kaldır",
    saving: "Kaydediliyor...",
    pickDriver: "Önce şoför seçin",
    pickVehicle: "Araç seçin",
    locked: "Bu durumda atama değiştirilemez",
    assignError: "Atama kaydedilemedi.",
    loadError: "Şoför ve araç listesi yüklenemedi.",
    unassignConfirm: "Atama kaldırılsın mı?",
  },
  en: {
    date: "Date",
    time: "Time",
    flight: "Flight",
    from: "From",
    to: "To",
    name: "Name",
    pax: "Pax",
    vehicleType: "Vehicle Type",
    plate: "Plate",
    driver: "Driver",
    notes: "Notes",
    amount: "Amount",
    status: "Status",
    choose: "Select",
    clear: "Remove assignment",
    saving: "Saving...",
    pickDriver: "Select a driver first",
    pickVehicle: "Select a vehicle",
    locked: "Assignment cannot be changed in this status",
    assignError: "Assignment could not be saved.",
    loadError: "Drivers and vehicles could not be loaded.",
    unassignConfirm: "Remove this assignment?",
  },
};

const EDITABLE_STATUSES = ["pending", "accepted"];

export default function SupplierTransferTable({
  transfers,
  selectedId,
  onSelect,
  onAssigned,
  statusLabels,
  locale,
}) {
  const { language } = useLanguage();
  const t = TEXT[language] || TEXT.en;

  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [rowErrors, setRowErrors] = useState({});
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([getSupplierDrivers(), getSupplierVehicles()])
      .then(([driverData, vehicleData]) => {
        if (!active) return;

        setDrivers(driverData.filter((driver) => driver.is_active));
        setVehicles(
          vehicleData.filter(
            (vehicle) =>
              vehicle.is_active && vehicle.operational_status === "active",
          ),
        );
      })
      .catch(() => active && setLoadError(t.loadError));

    return () => {
      active = false;
    };
  }, [t.loadError]);

  const driverById = useMemo(
    () => new Map(drivers.map((driver) => [String(driver.id), driver])),
    [drivers],
  );

  function currentSelection(transfer) {
    const draft = drafts[transfer.id];

    return {
      driverId:
        draft?.driverId ??
        (transfer.driver_id ? String(transfer.driver_id) : ""),
      vehicleId:
        draft?.vehicleId ??
        (transfer.assigned_vehicle_id
          ? String(transfer.assigned_vehicle_id)
          : transfer.driver?.vehicle_id
            ? String(transfer.driver.vehicle_id)
            : ""),
    };
  }

  function setDraft(transferId, values) {
    setDrafts((current) => ({
      ...current,
      [transferId]: { ...current[transferId], ...values },
    }));
  }

  async function save(transfer, driverId, vehicleId) {
    setSavingId(transfer.id);
    setRowErrors((current) => ({ ...current, [transfer.id]: "" }));

    try {
      const updated = await assignSupplierTransfer(
        transfer.id,
        driverId,
        vehicleId,
      );

      setDrafts((current) => {
        const next = { ...current };
        delete next[transfer.id];
        return next;
      });

      onAssigned?.(updated);
    } catch (error) {
      setRowErrors((current) => ({
        ...current,
        [transfer.id]:
          error.response?.data?.message || error.message || t.assignError,
      }));
    } finally {
      setSavingId(null);
    }
  }

  function handleDriverChange(transfer, driverId) {
    const vehicleId = driverId
      ? String(driverById.get(driverId)?.vehicle_id || "") ||
        currentSelection(transfer).vehicleId
      : "";

    setDraft(transfer.id, { driverId, vehicleId });

    if (driverId && vehicleId) {
      save(transfer, driverId, vehicleId);
    }
  }

  function handleVehicleChange(transfer, vehicleId) {
    const { driverId } = currentSelection(transfer);

    setDraft(transfer.id, { vehicleId });

    if (driverId && vehicleId) {
      save(transfer, driverId, vehicleId);
    }
  }

  async function handleUnassign(transfer) {
    if (!window.confirm(t.unassignConfirm)) return;

    setSavingId(transfer.id);

    try {
      const updated = await unassignSupplierTransfer(transfer.id);

      setDrafts((current) => {
        const next = { ...current };
        delete next[transfer.id];
        return next;
      });

      onAssigned?.(updated);
    } catch (error) {
      setRowErrors((current) => ({
        ...current,
        [transfer.id]:
          error.response?.data?.message || error.message || t.assignError,
      }));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="supplier-table-wrap">
      {loadError && <div className="supplier-message error">{loadError}</div>}

      <table className="supplier-transfer-table">
        <thead>
          <tr>
            <th>{t.date}</th>
            <th>{t.time}</th>
            <th>{t.flight}</th>
            <th>{t.from}</th>
            <th>{t.to}</th>
            <th>{t.name}</th>
            <th>{t.pax}</th>
            <th>{t.vehicleType}</th>
            <th>{t.plate}</th>
            <th>{t.driver}</th>
            <th>{t.notes}</th>
            <th>{t.amount}</th>
            <th>{t.status}</th>
          </tr>
        </thead>

        <tbody>
          {transfers.map((transfer) => {
            const { driverId, vehicleId } = currentSelection(transfer);
            const editable = EDITABLE_STATUSES.includes(transfer.status);
            const saving = savingId === transfer.id;
            const assigned = Boolean(transfer.driver_id);
            const when = parseDate(transfer.pickup_time);
            const phone = String(transfer.passenger_phone || "").replace(
              /\D/g,
              "",
            );
            const pax = `${Number(transfer.adult || 0)}+${
              Number(transfer.child || 0) + Number(transfer.baby || 0)
            }`;

            return (
              <tr
                key={transfer.id}
                className={[
                  assigned ? "assigned" : "unassigned",
                  Number(selectedId) === Number(transfer.id) ? "active" : "",
                ].join(" ")}
                onClick={() => onSelect(transfer)}
              >
                <td>
                  {when
                    ? when.toLocaleDateString(locale, {
                        day: "2-digit",
                        month: "2-digit",
                      })
                    : "-"}
                </td>
                <td>
                  {when
                    ? when.toLocaleTimeString(locale, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </td>
                <td>{transfer.flight_number || "-"}</td>
                <td
                  className={`cell-route ${airportRouteClass(transfer.pickup, transfer.dropoff)}`}
                >
                  {transfer.pickup}
                </td>
                <td className="cell-route">
                  {transfer.dropoff}
                </td>
                <td className="cell-name">
                  <span>{transfer.passenger_name || "-"}</span>
                  {phone && (
                    <a
                      className="wa-link"
                      href={`https://wa.me/${phone}`}
                      target="_blank"
                      rel="noreferrer"
                      title="WhatsApp"
                      aria-label="WhatsApp"
                      onClick={(event) => event.stopPropagation()}
                    >
                      WA
                    </a>
                  )}
                </td>
                <td>{pax}</td>
                <td>{transfer.vehicle_type || "-"}</td>

                <td onClick={(event) => event.stopPropagation()}>
                  {editable ? (
                    <select
                      value={vehicleId}
                      disabled={saving}
                      onChange={(event) =>
                        handleVehicleChange(transfer, event.target.value)
                      }
                    >
                      <option value="">{t.pickVehicle}</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.plate}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="supplier-assignment-value">
                      {transfer.assigned_vehicle?.plate ||
                        transfer.driver?.vehicle?.plate ||
                        "-"}
                    </span>
                  )}
                </td>

                <td onClick={(event) => event.stopPropagation()}>
                  {editable ? (
                    <div className="driver-cell">
                      <select
                        value={driverId}
                        disabled={saving}
                        onChange={(event) =>
                          handleDriverChange(transfer, event.target.value)
                        }
                      >
                        <option value="">{t.choose}</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name}
                          </option>
                        ))}
                      </select>

                      {assigned && (
                        <button
                          type="button"
                          className="unassign-button"
                          disabled={saving}
                          title={t.clear}
                          aria-label={t.clear}
                          onClick={() => handleUnassign(transfer)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="supplier-assignment-value">
                      {transfer.driver?.name || "-"}
                    </span>
                  )}

                  {saving && <small className="row-hint">{t.saving}</small>}
                  {!saving && driverId && !vehicleId && editable && (
                    <small className="row-hint">{t.pickVehicle}</small>
                  )}
                  {rowErrors[transfer.id] && (
                    <small className="row-hint error">
                      {rowErrors[transfer.id]}
                    </small>
                  )}
                </td>

                <td className="cell-notes">
                  {transfer.notes || transfer.passenger_note || ""}
                </td>
                <td className="cell-amount">
                  {formatMoney(
                    transfer.supplier_amount,
                    transfer.currency,
                    locale,
                  )}
                </td>
                <td>
                  <span className={`supplier-status ${transfer.status}`}>
                    {statusLabels[transfer.status] || transfer.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function airportRouteClass(pickup, dropoff) {
  const pickupAirport = getAirportCode(pickup);
  if (pickupAirport) {
    return `airport-route airport-route-${pickupAirport}-pickup`;
  }

  const dropoffAirport = getAirportCode(dropoff);
  if (dropoffAirport) {
    return `airport-route airport-route-${dropoffAirport}-dropoff`;
  }

  return "";
}

function getAirportCode(address) {
  const normalized = String(address || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (/\bsaw\b/.test(normalized) || normalized.includes("sabiha gokcen")) {
    return "saw";
  }

  if (
    /\bist\b/.test(normalized) ||
    normalized.includes("istanbul airport") ||
    normalized.includes("istanbul havalimani")
  ) {
    return "ist";
  }

  return null;
}

function parseDate(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatMoney(value, currency, locale) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency || "EUR",
    }).format(Number(value || 0));
  } catch {
    return `${Number(value || 0).toFixed(2)} ${currency || ""}`;
  }
}

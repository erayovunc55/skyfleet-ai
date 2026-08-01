import { useEffect, useMemo, useState } from "react";
import apiClient from "../services/apiClient";
import "./dispatcher.css";
import NewTransferModal from "./components/NewTransferModal";
import AssignDriverModal from "./components/AssignDriverModal";

const navItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "drivers", label: "Drivers" },
  { id: "transfers", label: "Transfers" },
  { id: "suppliers", label: "Suppliers" },
];

const summaryCards = [
  { id: "totalTransfers", label: "Total Transfers", value: 318, icon: "📦" },
  { id: "activeTransfers", label: "Active Transfers", value: 42, icon: "🚚" },
  { id: "waitingAssignment", label: "Waiting Assignment", value: 11, icon: "⏳" },
  { id: "activeDrivers", label: "Active Drivers", value: 24, icon: "👨‍✈️" },
];

const suppliers = [
  { name: "Istanbul Express", service: "Airport Transfers", rating: 4.9, contact: "support@istexpress.com" },
  { name: "Golden Shuttle", service: "Corporate Transfers", rating: 4.7, contact: "hello@goldenshuttle.com" },
  { name: "Bosphorus Transit", service: "VIP Transport", rating: 4.8, contact: "bookings@bosphorustransit.com" },
];

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "Waiting Assignment", label: "Waiting Assignment" },
  { value: "Assigned", label: "Assigned" },
  { value: "Driver En Route", label: "Driver En Route" },
  { value: "At Pickup", label: "At Pickup" },
  { value: "Ongoing", label: "Ongoing" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
];

const statusBadgeClasses = {
  "Waiting Assignment": "status-waiting",
  Assigned: "status-assigned",
  "Driver En Route": "status-enroute",
  "At Pickup": "status-atpickup",
  Ongoing: "status-ongoing",
  Completed: "status-completed",
  Cancelled: "status-cancelled",
};

function mapDispatcherStatus(status) {
  switch (status) {
    case "pending":
      return "Waiting Assignment";
    case "accepted":
    case "assigned":
      return "Assigned";
    case "on_the_way":
      return "Driver En Route";
    case "arrived":
    case "passenger_called":
      return "At Pickup";
    case "passenger_on_board":
    case "trip_started":
      return "Ongoing";
    case "completed":
      return "Completed";
    case "cancelled":
    case "no_show":
      return "Cancelled";
    default:
      return status || "Waiting Assignment";
  }
}

function formatLocation(location) {
  if (!location) return "-";
  if (typeof location === "string") return location.trim() || "-";

  if (typeof location === "object") {
    return (
      location.name ||
      location.native_name ||
      location.code ||
      location.address ||
      location.formatted_address ||
      "-"
    );
  }

  return String(location);
}

function formatPickupTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPickupDate(value) {
  if (!value) return "";

  const rawValue = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(rawValue)) {
    return rawValue.slice(0, 10);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function formatDriver(driver, driverName) {
  if (driverName) return driverName;
  if (!driver) return "Unassigned";
  if (typeof driver === "string") return driver;

  if (typeof driver === "object") {
    return driver.name || driver.full_name || driver.email || "Unassigned";
  }

  return String(driver);
}

function normalizeTransfer(item = {}) {
  const pickupTimeValue = item.pickup_time || item.pickupTime || item.date;

  return {
    id: item.id ?? null,
    voucher:
      item.voucher ||
      item.booking_reference ||
      item.bookingReference ||
      (item.id ? `SF-${item.id}` : ""),
    passenger:
      item.passenger_name ||
      item.passenger ||
      item.customer_name ||
      "Unknown passenger",
    flight: item.flight_number || item.flight || "-",
    pickup: formatLocation(
      item.pickup_location ??
        item.pickupLocation ??
        item.pickup ??
        item.pickup_address,
    ),
    dropoff: formatLocation(
      item.dropoff_location ??
        item.dropoffLocation ??
        item.dropoff ??
        item.dropoff_address,
    ),
    pickupTime: formatPickupTime(pickupTimeValue),
    date: formatPickupDate(pickupTimeValue || item.date),
    driverId: item.driver_id ?? item.driver?.id ?? null,
    driver: formatDriver(item.driver, item.driver_name),
    status: mapDispatcherStatus(item.status || item.state),
  };
}

function normalizeDriver(item = {}) {
  return {
    id: item.id,
    name: item.name || item.full_name || item.email || `Driver #${item.id}`,
    email: item.email || "",
    phone: item.phone || "",
    isActive: Boolean(item.is_active),
    vehicle: item.vehicle || null,
    status: item.is_active ? "Available" : "Inactive",
  };
}

function getInitialPage() {
  const routePath = window.location.hash
    ? window.location.hash.replace(/^#/, "")
    : window.location.pathname;

  if (routePath.includes("/dispatcher/drivers")) return "drivers";
  if (routePath.includes("/dispatcher/transfers")) return "transfers";
  if (routePath.includes("/dispatcher/suppliers")) return "suppliers";
  return "dashboard";
}

export default function DispatcherApp() {
  const [activePage, setActivePage] = useState(getInitialPage());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [transfersState, setTransfersState] = useState([]);
  const [driversState, setDriversState] = useState([]);

  const [isLoadingTransfers, setIsLoadingTransfers] = useState(false);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [driversError, setDriversError] = useState("");

  const [isNewTransferModalOpen, setIsNewTransferModalOpen] = useState(false);
  const [assignmentTransfer, setAssignmentTransfer] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const handlePopState = () => setActivePage(getInitialPage());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!toastMessage) return undefined;

    const timer = window.setTimeout(() => setToastMessage(""), 3500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (activePage !== "transfers") return undefined;

    const controller = new AbortController();

    async function loadTransfers() {
      setIsLoadingTransfers(true);
      setLoadError("");

      try {
        const response = await apiClient.get("/dispatcher/transfers", {
          signal: controller.signal,
        });

        const items = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        setTransfersState(items.map(normalizeTransfer));
      } catch (error) {
        if (
          error?.name !== "CanceledError" &&
          error?.name !== "AbortError" &&
          error?.code !== "ERR_CANCELED"
        ) {
          setLoadError(
            error?.response?.data?.message ||
              "Unable to load transfers. Please refresh the page.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingTransfers(false);
      }
    }

    loadTransfers();
    return () => controller.abort();
  }, [activePage]);

  useEffect(() => {
    if (!["transfers", "drivers"].includes(activePage)) return undefined;

    const controller = new AbortController();

    async function loadDrivers() {
      setIsLoadingDrivers(true);
      setDriversError("");

      try {
        const response = await apiClient.get("/drivers", {
          signal: controller.signal,
        });

        const items = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        setDriversState(items.map(normalizeDriver));
      } catch (error) {
        if (
          error?.name !== "CanceledError" &&
          error?.name !== "AbortError" &&
          error?.code !== "ERR_CANCELED"
        ) {
          setDriversError(
            error?.response?.data?.message ||
              "Unable to load drivers. Please refresh the page.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingDrivers(false);
      }
    }

    loadDrivers();
    return () => controller.abort();
  }, [activePage]);

  const activeDrivers = useMemo(
    () => driversState.filter((driver) => driver.isActive),
    [driversState],
  );

  const uniqueDates = useMemo(
    () =>
      Array.from(
        new Set(transfersState.map((transfer) => transfer.date).filter(Boolean)),
      ).sort(),
    [transfersState],
  );

  const visibleTransfers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");

    return transfersState.filter((transfer) => {
      if (statusFilter && transfer.status !== statusFilter) return false;
      if (dateFilter && transfer.date !== dateFilter) return false;
      if (!query) return true;

      return [
        transfer.voucher,
        transfer.passenger,
        transfer.flight,
        transfer.pickup,
        transfer.dropoff,
        transfer.driver,
      ]
        .map((value) => String(value ?? ""))
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(query);
    });
  }, [search, statusFilter, dateFilter, transfersState]);

  function navigate(page) {
    setActivePage(page);
    const route = page === "dashboard" ? "/dispatcher" : `/dispatcher/${page}`;
    window.history.pushState({}, "", route);
  }

  async function handleSaveTransfer(payload) {
    const response = await apiClient.post("/dispatcher/transfers", payload);
    const createdItem = response.data?.data;

    if (!createdItem) {
      throw new Error("The API did not return the created transfer.");
    }

    const transfer = normalizeTransfer(createdItem);

    setTransfersState((currentTransfers) => [
      transfer,
      ...currentTransfers.filter(
        (currentTransfer) => currentTransfer.id !== transfer.id,
      ),
    ]);

    setToastMessage("Transfer created successfully.");
    setIsNewTransferModalOpen(false);

    return createdItem;
  }

  async function handleAssignDriver(driverId) {
    if (!assignmentTransfer?.id) {
      throw new Error("The selected transfer has no database ID.");
    }

    const response = await apiClient.patch(
      `/dispatcher/transfers/${assignmentTransfer.id}/assign`,
      { driver_id: Number(driverId) },
    );

    const updatedItem = response.data?.data;
    if (!updatedItem) {
      throw new Error("The API did not return the updated transfer.");
    }

    const updatedTransfer = normalizeTransfer(updatedItem);

    setTransfersState((currentTransfers) =>
      currentTransfers.map((transfer) =>
        transfer.id === updatedTransfer.id ? updatedTransfer : transfer,
      ),
    );

    setAssignmentTransfer(null);
    setToastMessage(
      response.data?.message || "Driver assigned successfully.",
    );

    return updatedItem;
  }

  const pageTitle =
    navItems.find((item) => item.id === activePage)?.label || "Dispatcher";

  return (
    <div className="dispatcher-shell">
      <aside className="dispatcher-sidebar">
        <div className="dispatcher-brand">
          <span>SKYFLEET</span>
          <strong>Dispatcher</strong>
        </div>

        <nav className="dispatcher-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                item.id === activePage
                  ? "dispatcher-nav-item active"
                  : "dispatcher-nav-item"
              }
              onClick={() => navigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="dispatcher-main">
        <header className="dispatcher-header">
          <div>
            <p>Dispatcher Panel</p>
            <h1>{pageTitle}</h1>
          </div>

          <div className="dispatcher-header-actions">
            <button
              type="button"
              className="dispatcher-btn dispatcher-btn-primary"
              onClick={() => setIsNewTransferModalOpen(true)}
            >
              New Transfer
            </button>
          </div>
        </header>

        {toastMessage && (
          <div className="dispatcher-toast" role="status">
            {toastMessage}
          </div>
        )}

        <section className="dispatcher-page">
          {activePage === "dashboard" && (
            <>
              <div className="dispatcher-summary-grid">
                {summaryCards.map((card) => (
                  <article key={card.id} className="dispatcher-summary-card">
                    <div className="dispatcher-summary-icon">{card.icon}</div>
                    <div>
                      <p>{card.label}</p>
                      <strong>{card.value}</strong>
                    </div>
                  </article>
                ))}
              </div>

              <div className="dispatcher-overview-cards">
                <article className="dispatcher-overview-card">
                  <h2>Recent Activity</h2>
                  <p>
                    Monitor transfer activity, driver status, and assignment
                    progress from one place.
                  </p>
                </article>

                <article className="dispatcher-overview-card">
                  <h2>Quick Actions</h2>
                  <p>
                    Assign new transfers, review driver status, and ensure the
                    fleet is operating smoothly.
                  </p>
                </article>
              </div>
            </>
          )}

          {activePage === "drivers" && (
            <>
              {isLoadingDrivers ? (
                <div className="dispatcher-loading-state">
                  <p>Loading drivers...</p>
                </div>
              ) : driversError ? (
                <div className="dispatcher-error-state">
                  <p>{driversError}</p>
                </div>
              ) : (
                <div className="dispatcher-grid-list">
                  {driversState.map((driver) => (
                    <article
                      key={driver.id}
                      className="dispatcher-card dispatcher-card-large"
                    >
                      <div>
                        <h3>{driver.name}</h3>
                        <p>{driver.status}</p>
                      </div>

                      <div className="dispatcher-card-meta">
                        <span>{driver.vehicle?.plate || "No vehicle"}</span>
                        <span>{driver.phone || driver.email || "-"}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {activePage === "transfers" && (
            <div className="dispatcher-transfers-page">
              <div className="dispatcher-transfers-header">
                <div>
                  <h2>Transfers</h2>
                  <p className="dispatcher-page-copy">
                    Search, filter, and review transfer status across the entire
                    dispatch queue.
                  </p>
                </div>
              </div>

              <div className="dispatcher-transfers-controls">
                <input
                  type="text"
                  className="dispatcher-search"
                  placeholder="Search by voucher, passenger, driver or location"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />

                <select
                  className="dispatcher-filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  className="dispatcher-filter"
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value)}
                >
                  <option value="">All Dates</option>
                  {uniqueDates.map((date) => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))}
                </select>
              </div>

              {isLoadingTransfers ? (
                <div className="dispatcher-loading-state">
                  <p>Loading transfers...</p>
                </div>
              ) : loadError ? (
                <div className="dispatcher-error-state">
                  <p>{loadError}</p>
                </div>
              ) : visibleTransfers.length > 0 ? (
                <>
                  <div className="dispatcher-table-wrap">
                    <table className="dispatcher-table">
                      <thead>
                        <tr>
                          <th>Voucher</th>
                          <th>Passenger</th>
                          <th>Flight</th>
                          <th>Pickup</th>
                          <th>Dropoff</th>
                          <th>Pickup Time</th>
                          <th>Driver</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {visibleTransfers.map((transfer) => {
                          const badgeClass =
                            statusBadgeClasses[transfer.status] ||
                            "status-waiting";

                          return (
                            <tr key={transfer.id ?? transfer.voucher}>
                              <td>{transfer.voucher || "-"}</td>
                              <td>{transfer.passenger || "-"}</td>
                              <td>{transfer.flight || "-"}</td>
                              <td>{formatLocation(transfer.pickup)}</td>
                              <td>{formatLocation(transfer.dropoff)}</td>
                              <td>{transfer.pickupTime || "-"}</td>
                              <td>{transfer.driver || "Unassigned"}</td>
                              <td>
                                <span className={`badge ${badgeClass}`}>
                                  {transfer.status}
                                </span>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="dispatcher-action-button"
                                  disabled={!transfer.id}
                                  onClick={() => setAssignmentTransfer(transfer)}
                                >
                                  Assign Driver
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="dispatcher-transfer-cards">
                    {visibleTransfers.map((transfer) => {
                      const badgeClass =
                        statusBadgeClasses[transfer.status] || "status-waiting";

                      return (
                        <article
                          key={`card-${transfer.id ?? transfer.voucher}`}
                          className="dispatcher-transfer-card"
                        >
                          <div className="transfer-card-header">
                            <div>
                              <strong>{transfer.passenger || "-"}</strong>
                              <span>{transfer.voucher || "-"}</span>
                            </div>

                            <span className={`badge ${badgeClass}`}>
                              {transfer.status}
                            </span>
                          </div>

                          <div className="transfer-card-row">
                            <div>
                              <span>Flight</span>
                              <strong>{transfer.flight || "-"}</strong>
                            </div>

                            <div>
                              <span>Pickup Time</span>
                              <strong>{transfer.pickupTime || "-"}</strong>
                            </div>
                          </div>

                          <div className="transfer-card-row">
                            <div>
                              <span>Pickup</span>
                              <strong>{formatLocation(transfer.pickup)}</strong>
                            </div>

                            <div>
                              <span>Dropoff</span>
                              <strong>{formatLocation(transfer.dropoff)}</strong>
                            </div>
                          </div>

                          <div className="transfer-card-footer">
                            <span>{transfer.driver || "Unassigned"}</span>

                            <button
                              type="button"
                              className="dispatcher-action-button dispatcher-action-button-secondary"
                              disabled={!transfer.id}
                              onClick={() => setAssignmentTransfer(transfer)}
                            >
                              Assign Driver
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="dispatcher-empty-state">
                  <p>No transfers match the selected filters.</p>
                  <small>
                    Try resetting the search or changing the status and date
                    filters.
                  </small>
                </div>
              )}
            </div>
          )}

          {activePage === "suppliers" && (
            <div className="dispatcher-grid-list">
              {suppliers.map((supplier) => (
                <article
                  key={supplier.name}
                  className="dispatcher-card dispatcher-card-large"
                >
                  <div>
                    <h3>{supplier.name}</h3>
                    <p>{supplier.service}</p>
                  </div>

                  <div className="dispatcher-card-meta">
                    <span>Rating {supplier.rating}</span>
                    <span>{supplier.contact}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <NewTransferModal
        open={isNewTransferModalOpen}
        onClose={() => setIsNewTransferModalOpen(false)}
        onSave={handleSaveTransfer}
        drivers={activeDrivers}
      />

      <AssignDriverModal
        open={Boolean(assignmentTransfer)}
        transfer={assignmentTransfer}
        drivers={activeDrivers}
        isLoadingDrivers={isLoadingDrivers}
        driversError={driversError}
        onClose={() => setAssignmentTransfer(null)}
        onAssign={handleAssignDriver}
      />
    </div>
  );
}
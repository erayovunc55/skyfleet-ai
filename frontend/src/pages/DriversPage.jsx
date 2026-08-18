import {
  useEffect,
  useMemo,
  useState,
} from "react";

import CreateDriverModal from "../components/CreateDriverModal";

import {
  assignVehicleToDriver,
  getDrivers,
} from "../services/driverService";

import {
  getVehicles,
} from "../services/vehicleService";

export default function DriversPage() {
  const [drivers, setDrivers] =
    useState([]);

  const [vehicles, setVehicles] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [
    savingDriverId,
    setSavingDriverId,
  ] = useState(null);

  const [
    showCreateDriver,
    setShowCreateDriver,
  ] = useState(false);

  const [
    editingDriver,
    setEditingDriver,
  ] = useState(null);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const [
        driverItems,
        vehicleItems,
      ] = await Promise.all([
        getDrivers(),
        getVehicles(),
      ]);

      setDrivers(
        Array.isArray(driverItems)
          ? driverItems
          : [],
      );

      setVehicles(
        Array.isArray(vehicleItems)
          ? vehicleItems
          : [],
      );
    } catch (requestError) {
      setError(
        requestError?.response?.data
          ?.message ||
          requestError?.message ||
          "Sürücüler yüklenemedi.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVehicleChange(
    driver,
    value,
  ) {
    setSavingDriverId(driver.id);
    setError("");
    setMessage("");

    try {
      await assignVehicleToDriver(
        driver.id,
        value ? Number(value) : null,
      );

      await loadData();

      setMessage(
        value
          ? "Araç sürücüye atandı."
          : "Sürücünün araç ataması kaldırıldı.",
      );
    } catch (requestError) {
      setError(
        requestError?.response?.data
          ?.message ||
          requestError?.message ||
          "Araç ataması kaydedilemedi.",
      );
    } finally {
      setSavingDriverId(null);
    }
  }

  const filteredDrivers =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR",
          );

      if (!query) {
        return drivers;
      }

      return drivers.filter(
        (driver) => {
          const searchable = [
            driver.name,
            driver.phone,
            driver.email,
            driver.vehicle_plate,
            driver.vehicle?.plate,
            driver.vehicle
              ?.license_plate,
          ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase(
              "tr-TR",
            );

          return searchable.includes(
            query,
          );
        },
      );
    }, [drivers, search]);

  const activeDriverCount =
    drivers.filter(
      (driver) =>
        driver.is_active,
    ).length;

  const assignedDriverCount =
    drivers.filter(
      (driver) =>
        driver.vehicle_id ||
        driver.vehicle,
    ).length;

  return (
    <main className="drivers-page">
      <header className="drivers-page-header">
        <div>
          <span className="drivers-eyebrow">
            OPERASYON
          </span>

          <h1>Sürücü Yönetimi</h1>

          <p>
            Sürücüleri ve araç
            atamalarını tek ekrandan
            yönetin.
          </p>
        </div>

        <div className="drivers-header-actions">
          <button
            className="drivers-create-button"
            type="button"
            onClick={() => {
              setEditingDriver(null);
              setShowCreateDriver(
                true,
              );
            }}
          >
            + Yeni Sürücü
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={loadData}
          >
            {loading
              ? "Yükleniyor..."
              : "Yenile"}
          </button>
        </div>
      </header>

      <section className="drivers-summary-grid">
        <article>
          <span>
            Toplam Sürücü
          </span>

          <strong>
            {drivers.length}
          </strong>
        </article>

        <article>
          <span>
            Aktif Sürücü
          </span>

          <strong>
            {activeDriverCount}
          </strong>
        </article>

        <article>
          <span>
            Araç Atanmış
          </span>

          <strong>
            {assignedDriverCount}
          </strong>
        </article>

        <article>
          <span>
            Araç Bekleyen
          </span>

          <strong>
            {Math.max(
              drivers.length -
                assignedDriverCount,
              0,
            )}
          </strong>
        </article>
      </section>

      <section className="drivers-content-card">
        <div className="drivers-toolbar">
          <div>
            <h2>Sürücüler</h2>

            <span>
              {filteredDrivers.length}{" "}
              kayıt
            </span>
          </div>

          <input
            type="search"
            value={search}
            placeholder="Sürücü, telefon veya plaka ara..."
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
          />
        </div>

        {error && (
          <div className="drivers-message error">
            {error}
          </div>
        )}

        {message && (
          <div className="drivers-message success">
            {message}
          </div>
        )}

        {loading && (
          <div className="drivers-empty-state">
            Sürücüler yükleniyor...
          </div>
        )}

        {!loading &&
          filteredDrivers.length ===
            0 && (
            <div className="drivers-empty-state">
              Sürücü bulunamadı.
            </div>
          )}

        {!loading &&
          filteredDrivers.length >
            0 && (
            <div className="drivers-table-wrapper">
              <table className="drivers-table">
                <thead>
                  <tr>
                    <th>Sürücü</th>
                    <th>İletişim</th>
                    <th>Durum</th>
                    <th>
                      Atanmış Araç
                    </th>
                    <th>
                      Araç Ataması
                    </th>
                    <th>İşlem</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDrivers.map(
                    (driver) => (
                      <tr
                        key={driver.id}
                      >
                        <td>
                          <div className="driver-identity">
                            <span>
                              {getInitials(
                                driver.name,
                              )}
                            </span>

                            <div>
                              <strong>
                                {driver.name ||
                                  "İsimsiz sürücü"}
                              </strong>

                              <small>
                                ID #
                                {driver.id}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="driver-contact">
                            <span>
                              {driver.phone ||
                                "Telefon yok"}
                            </span>

                            <small>
                              {driver.email ||
                                "E-posta yok"}
                            </small>
                          </div>
                        </td>

                        <td>
                          <span
                            className={
                              driver.is_active
                                ? "driver-state active"
                                : "driver-state passive"
                            }
                          >
                            {driver.is_active
                              ? "Aktif"
                              : "Pasif"}
                          </span>
                        </td>

                        <td>
                          {driver.vehicle ? (
                            <div className="driver-vehicle">
                              <strong>
                                {getVehiclePlate(
                                  driver.vehicle,
                                )}
                              </strong>

                              <small>
                                {getVehicleName(
                                  driver.vehicle,
                                )}
                              </small>
                            </div>
                          ) : (
                            <span className="driver-no-vehicle">
                              Araç atanmadı
                            </span>
                          )}
                        </td>

                        <td>
                          <select
                            value={
                              driver.vehicle_id ||
                              driver.vehicle
                                ?.id ||
                              ""
                            }
                            disabled={
                              savingDriverId ===
                              driver.id
                            }
                            onChange={(
                              event,
                            ) =>
                              handleVehicleChange(
                                driver,
                                event
                                  .target
                                  .value,
                              )
                            }
                          >
                            <option value="">
                              Araç yok
                            </option>

                            {vehicles.map(
                              (
                                vehicle,
                              ) => (
                                <option
                                  key={
                                    vehicle.id
                                  }
                                  value={
                                    vehicle.id
                                  }
                                  disabled={
                                    !vehicle.is_active ||
                                    vehicle.operational_status ===
                                      "inactive"
                                  }
                                >
                                  {getVehiclePlate(
                                    vehicle,
                                  )}{" "}
                                  —{" "}
                                  {getVehicleName(
                                    vehicle,
                                  )}
                                </option>
                              ),
                            )}
                          </select>
                        </td>

                        <td>
                          <button
                            className="driver-edit-button"
                            type="button"
                            onClick={() => {
                              setShowCreateDriver(
                                false,
                              );

                              setEditingDriver(
                                driver,
                              );
                            }}
                          >
                            Düzenle
                          </button>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
      </section>

      {(showCreateDriver ||
        editingDriver) && (
        <CreateDriverModal
          driver={editingDriver}
          vehicles={vehicles}
          onClose={() => {
            setShowCreateDriver(
              false,
            );

            setEditingDriver(
              null,
            );
          }}
          onSaved={async () => {
            const wasEditing =
              Boolean(
                editingDriver,
              );

            setShowCreateDriver(
              false,
            );

            setEditingDriver(
              null,
            );

            await loadData();

            setMessage(
              wasEditing
                ? "Sürücü bilgileri güncellendi."
                : "Sürücü başarıyla oluşturuldu.",
            );
          }}
        />
      )}
    </main>
  );
}

function getInitials(name) {
  return String(name || "SF")
    .trim()
    .split(/\s+/)
    .map((part) =>
      part.charAt(0),
    )
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getVehiclePlate(
  vehicle,
) {
  return (
    vehicle?.plate ||
    vehicle?.license_plate ||
    vehicle?.vehicle_plate ||
    "Plaka yok"
  );
}

function getVehicleName(
  vehicle,
) {
  const value = [
    vehicle?.brand,
    vehicle?.model,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    value ||
    "Araç bilgisi yok"
  );
}
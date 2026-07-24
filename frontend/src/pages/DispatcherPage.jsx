import { useEffect, useMemo, useState } from "react";

import TransferLiveMetrics from "../components/TransferLiveMetrics";
import DispatcherStats from "../components/DispatcherStats";
import DispatcherTransferCard from "../components/DispatcherTransferCard";
import DispatcherMap from "../components/DispatcherMap";

import echo from "../services/echo";
import { getDispatcherTransfers } from "../services/dispatcherService";

export default function DispatcherPage({
  onViewTransfer,
  onOpenFleet,
}) {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTransfer, setSelectedTransfer] =
    useState(null);

  useEffect(() => {
    async function loadTransfers() {
      try {
        const data = await getDispatcherTransfers();

        const normalizedTransfers = Array.isArray(data)
          ? data
          : [];

        setTransfers(normalizedTransfers);

        setSelectedTransfer((currentTransfer) => {
          if (currentTransfer) {
            const updatedTransfer =
              normalizedTransfers.find(
                (transfer) =>
                  transfer.id === currentTransfer.id,
              );

            return (
              updatedTransfer ||
              normalizedTransfers[0] ||
              null
            );
          }

          return normalizedTransfers[0] || null;
        });

        setError("");
      } catch (err) {
        setError(
          err.message ||
            "Operasyon verileri yüklenemedi.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadTransfers();

    const refreshTimer = window.setInterval(
      loadTransfers,
      10000,
    );

    return () => {
      window.clearInterval(refreshTimer);
    };
  }, []);

  useEffect(() => {
    if (!selectedTransfer?.id) {
      return;
    }

    const channelName = `transfer.${selectedTransfer.id}`;

    const channel = echo
      .channel(channelName)
      .listen(
        ".driver.location.updated",
        (location) => {
          console.log(
            "GPS EVENT GELDİ:",
            location,
          );

          setTransfers((currentTransfers) =>
            currentTransfers.map((transfer) => {
              if (
                transfer.id !==
                Number(location.transfer_id)
              ) {
                return transfer;
              }

              return {
                ...transfer,
                latest_location: {
                  ...transfer.latest_location,
                  ...location,
                },
              };
            }),
          );

          setSelectedTransfer((currentTransfer) => {
            if (
              !currentTransfer ||
              currentTransfer.id !==
                Number(location.transfer_id)
            ) {
              return currentTransfer;
            }

            return {
              ...currentTransfer,
              latest_location: {
                ...currentTransfer.latest_location,
                ...location,
              },
            };
          });
        },
      );

    return () => {
      echo.leave(channelName);
    };
  }, [selectedTransfer?.id]);

  const stats = useMemo(() => {
    const activeStatuses = [
      "accepted",
      "on_the_way",
      "arrived",
      "passenger_called",
      "passenger_on_board",
      "trip_started",
    ];

    return {
      waiting: transfers.filter(
        (transfer) =>
          transfer.status === "pending",
      ).length,

      active: transfers.filter((transfer) =>
        activeStatuses.includes(transfer.status),
      ).length,

      completed: transfers.filter(
        (transfer) =>
          transfer.status === "completed",
      ).length,
    };
  }, [transfers]);

  return (
    <main className="dispatcher-page">
      <header className="dispatcher-page-header">
        <div>
          <p>SKYFLEET AI CONTROL CENTER</p>
          <h1>Dispatcher Panel</h1>
        </div>

        <div className="dispatcher-header-actions">
          <span>
            Son güncelleme:{" "}
            {new Date().toLocaleTimeString(
              "tr-TR",
              {
                hour: "2-digit",
                minute: "2-digit",
              },
            )}
          </span>

          <button
            type="button"
            onClick={onOpenFleet}
          >
            Filo Yönetimi
          </button>
        </div>
      </header>

      <DispatcherStats
        active={stats.active}
        completed={stats.completed}
        waiting={stats.waiting}
      />

      {loading && (
        <p className="dashboard-message">
          Operasyon verileri yükleniyor...
        </p>
      )}

      {error && (
        <p className="dashboard-error">
          {error}
        </p>
      )}

      {!loading &&
        !error &&
        transfers.length === 0 && (
          <p className="dashboard-message">
            Transfer bulunamadı.
          </p>
        )}

      {!loading &&
        !error &&
        transfers.length > 0 && (
          <section className="dispatcher-workspace">
            <div className="dispatcher-list-panel">
              <div className="dispatcher-panel-heading">
                <div>
                  <p>OPERASYONLAR</p>
                  <h2>Transfer Listesi</h2>
                </div>

                <span>
                  {transfers.length} transfer
                </span>
              </div>

              <div className="dispatcher-list">
                {transfers.map((transfer) => {
                  const normalizedTransfer = {
  ...transfer,

  driver:
    transfer.driver?.name ||
    "Sürücü atanmamış",

  driver_phone:
    transfer.driver?.phone || null,

  driver_vehicle:
    transfer.driver?.vehicle || null,

  passenger:
    transfer.passenger_name ||
    "Yolcu belirtilmedi",

  flight:
    transfer.flight_number ||
    "Belirtilmedi",

  pickup_time: formatTime(
    transfer.pickup_time,
  ),
};

                  return (
                    <div
                      className={
                        selectedTransfer?.id ===
                        transfer.id
                          ? "dispatcher-card-wrapper selected"
                          : "dispatcher-card-wrapper"
                      }
                      key={transfer.id}
                      onClick={() =>
                        setSelectedTransfer(transfer)
                      }
                    >
                      <DispatcherTransferCard
                        transfer={
                          normalizedTransfer
                        }
                        onViewDetail={() =>
                          onViewTransfer?.(transfer)
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <aside className="dispatcher-map-panel">
              <div className="dispatcher-panel-heading">
                <div>
                  <p>CANLI HARİTA</p>

                  <h2>
                    {selectedTransfer
                      ? selectedTransfer.booking_reference
                      : "Transfer seçilmedi"}
                  </h2>
                </div>

                {selectedTransfer && (
                  <span>
                    {getStatusLabel(
                      selectedTransfer.status,
                    )}
                  </span>
                )}
              </div>

              <TransferLiveMetrics
                transfer={selectedTransfer}
              />

              <DispatcherMap
                transfer={selectedTransfer}
              />
            </aside>
          </section>
        )}
    </main>
  );
}

function formatTime(dateTime) {
  if (!dateTime) {
    return "--:--";
  }

  return new Date(dateTime).toLocaleTimeString(
    "tr-TR",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function getStatusLabel(status) {
  const labels = {
    pending: "Bekliyor",
    accepted: "Kabul Edildi",
    on_the_way: "Yola Çıkıldı",
    arrived: "Alış Noktasında",
    passenger_called: "Yolcu Arandı",
    passenger_on_board: "Yolcu Geldi",
    trip_started: "Yolculuk Başladı",
    completed: "Tamamlandı",
    no_show: "No Show",
  };

  return labels[status] || status;
}
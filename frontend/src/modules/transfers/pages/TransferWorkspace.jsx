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

import LiveOperationMap from "../components/LiveOperationMap";
import LiveTransferSync from "../components/LiveTransferSync";
import TimelineCard from "../components/TimelineCard";
import TransferDetail from "../components/TransferDetail";
import TransferExcelImportModal from "../components/TransferExcelImportModal";
import TransferList from "../components/TransferList";

import useTransfer from "../hooks/useTransfer";
import useTransfers from "../hooks/useTransfers";

export default function TransferWorkspace() {
  const [
    showExcelImport,
    setShowExcelImport,
  ] = useState(false);

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    getDateKey(new Date()),
  );

  const {
    transfers,
    loading,
    error,
    reload,
  } = useTransfers();

  const {
    selectedTransfer,
    selectTransfer,
  } = useTransfer();

  const filteredTransfers =
    useMemo(() => {
      if (
        !Array.isArray(transfers)
      ) {
        return [];
      }

      return transfers
        .filter(
          (transfer) =>
            getDateKey(
              transfer.pickup_time,
            ) === selectedDate,
        )
        .sort(
          (first, second) =>
            new Date(
              first.pickup_time,
            ).getTime() -
            new Date(
              second.pickup_time,
            ).getTime(),
        );
    }, [
      transfers,
      selectedDate,
    ]);

  useEffect(() => {
    if (
      filteredTransfers.length ===
      0
    ) {
      if (selectedTransfer) {
        selectTransfer(null);
      }

      return;
    }

    const selectedExists =
      filteredTransfers.some(
        (transfer) =>
          Number(transfer.id) ===
          Number(
            selectedTransfer?.id,
          ),
      );

    if (!selectedExists) {
      selectTransfer(
        filteredTransfers[0],
      );
    }
  }, [
    filteredTransfers,
    selectedTransfer,
    selectTransfer,
  ]);

  async function handleImported() {
    await reload();
  }

  function goToPreviousDay() {
    setSelectedDate(
      shiftDate(
        selectedDate,
        -1,
      ),
    );
  }

  function goToNextDay() {
    setSelectedDate(
      shiftDate(
        selectedDate,
        1,
      ),
    );
  }

  function goToToday() {
    setSelectedDate(
      getDateKey(new Date()),
    );
  }

  return (
    <>
      <main className="transfer-workspace">
        <Card
          className="transfer-workspace-list"
          title="Günün Operasyonları"
          subtitle={`${filteredTransfers.length} transfer`}
          actions={
            <div className="transfer-workspace-actions">
              <Button
                size="sm"
                onClick={() =>
                  setShowExcelImport(
                    true,
                  )
                }
              >
                Excel’den Aktar
              </Button>

              <Button
                variant="ghost"
                size="sm"
                loading={loading}
                onClick={reload}
              >
                Yenile
              </Button>
            </div>
          }
        >
          <div className="transfer-date-filter">
            <button
              type="button"
              onClick={
                goToPreviousDay
              }
              aria-label="Önceki gün"
            >
              ‹
            </button>

            <label>
              <span>
                Operasyon tarihi
              </span>

              <input
                type="date"
                value={selectedDate}
                onChange={(event) =>
                  setSelectedDate(
                    event.target
                      .value,
                  )
                }
              />
            </label>

            <button
              type="button"
              onClick={goToNextDay}
              aria-label="Sonraki gün"
            >
              ›
            </button>

            <button
              className="today"
              type="button"
              onClick={goToToday}
            >
              Bugün
            </button>
          </div>

          <div className="transfer-selected-date">
            <strong>
              {formatSelectedDate(
                selectedDate,
              )}
            </strong>

            <span>
              {
                filteredTransfers.length
              }{" "}
              transfer
            </span>
          </div>

          <TransferList
            transfers={
              filteredTransfers
            }
            loading={loading}
            error={error}
          />
        </Card>

        <Card
          className="transfer-workspace-detail"
          title="Transfer Detayı"
          subtitle={
            selectedTransfer
              ? selectedTransfer
                  .booking_reference
              : "Transfer seçilmedi"
          }
          actions={
            selectedTransfer ? (
              <StatusBadge
                status={
                  selectedTransfer
                    .status
                }
              />
            ) : null
          }
        >
          {selectedTransfer ? (
            <TransferDetail />
          ) : (
            <div className="transfer-detail-empty">
              Seçilen tarihte
              görüntülenecek transfer
              bulunmuyor.
            </div>
          )}
        </Card>

        <Card
          className="transfer-workspace-map"
          title="Canlı Operasyon Haritası"
          subtitle="GPS, pickup ve dropoff bilgileri"
        >
          <LiveTransferSync />

          <LiveOperationMap />
        </Card>

        <section className="transfer-workspace-timeline">
          <TimelineCard />
        </section>
      </main>

      <TransferExcelImportModal
        open={showExcelImport}
        onClose={() =>
          setShowExcelImport(false)
        }
        onImported={
          handleImported
        }
      />
    </>
  );
}

function getDateKey(value) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function shiftDate(
  dateKey,
  amount,
) {
  const date = new Date(
    `${dateKey}T12:00:00`,
  );

  date.setDate(
    date.getDate() + amount,
  );

  return getDateKey(date);
}

function formatSelectedDate(
  dateKey,
) {
  const date = new Date(
    `${dateKey}T12:00:00`,
  );

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Tarih seçilmedi";
  }

  return date.toLocaleDateString(
    "tr-TR",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  );
}
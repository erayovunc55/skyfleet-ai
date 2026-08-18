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

import { useLanguage } from "../../../i18n";
import LiveOperationMap from "../components/LiveOperationMap";
import LiveTransferSync from "../components/LiveTransferSync";
import TimelineCard from "../components/TimelineCard";
import TransferDetail from "../components/TransferDetail";
import TransferExcelImportModal from "../components/TransferExcelImportModal";
import TransferList from "../components/TransferList";

import useTransfer from "../hooks/useTransfer";
import useTransfers from "../hooks/useTransfers";

const TEXT = {
  tr: {
    operations: "Günün Operasyonları",
    transfer: "transfer",
    importExcel: "Excel’den Aktar",
    refresh: "Yenile",
    previousDay: "Önceki gün",
    operationDate: "Operasyon tarihi",
    nextDay: "Sonraki gün",
    today: "Bugün",
    detail: "Transfer Detayı",
    notSelected: "Transfer seçilmedi",
    emptyDetail: "Seçilen tarihte görüntülenecek transfer bulunmuyor.",
    map: "Canlı Operasyon Haritası",
    mapSubtitle: "GPS, pickup ve dropoff bilgileri",
    noDate: "Tarih seçilmedi",
  },
  en: {
    operations: "Today's Operations",
    transfer: "transfers",
    importExcel: "Import from Excel",
    refresh: "Refresh",
    previousDay: "Previous day",
    operationDate: "Operation date",
    nextDay: "Next day",
    today: "Today",
    detail: "Transfer Details",
    notSelected: "No transfer selected",
    emptyDetail: "No transfers are available for the selected date.",
    map: "Live Operations Map",
    mapSubtitle: "GPS, pickup and dropoff information",
    noDate: "No date selected",
  },
  ar: {
    operations: "عمليات اليوم",
    transfer: "تحويلات",
    importExcel: "استيراد من Excel",
    refresh: "تحديث",
    previousDay: "اليوم السابق",
    operationDate: "تاريخ العملية",
    nextDay: "اليوم التالي",
    today: "اليوم",
    detail: "تفاصيل التحويل",
    notSelected: "لم يتم اختيار تحويل",
    emptyDetail: "لا توجد تحويلات للعرض في التاريخ المحدد.",
    map: "خريطة العمليات المباشرة",
    mapSubtitle: "معلومات GPS ونقطة الاستلام والوجهة",
    noDate: "لم يتم اختيار تاريخ",
  },
  es: {
    operations: "Operaciones de hoy",
    transfer: "traslados",
    importExcel: "Importar desde Excel",
    refresh: "Actualizar",
    previousDay: "Día anterior",
    operationDate: "Fecha de operación",
    nextDay: "Día siguiente",
    today: "Hoy",
    detail: "Detalles del traslado",
    notSelected: "Ningún traslado seleccionado",
    emptyDetail: "No hay traslados para la fecha seleccionada.",
    map: "Mapa de operaciones en vivo",
    mapSubtitle: "Información de GPS, recogida y destino",
    noDate: "No se seleccionó fecha",
  },
};

const LOCALES = {
  tr: "tr-TR",
  en: "en-GB",
  ar: "ar-SA",
  es: "es-ES",
};

export default function TransferWorkspace() {
  const { language } = useLanguage();
  const text = TEXT[language] || TEXT.en;
  const locale = LOCALES[language] || LOCALES.en;

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
          title={text.operations}
          subtitle={`${filteredTransfers.length} ${text.transfer}`}
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
                {text.importExcel}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                loading={loading}
                onClick={reload}
              >
                {text.refresh}
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
              aria-label={text.previousDay}
            >
              ‹
            </button>

            <label>
              <span>
                {text.operationDate}
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
              aria-label={text.nextDay}
            >
              ›
            </button>

            <button
              className="today"
              type="button"
              onClick={goToToday}
            >
              {text.today}
            </button>
          </div>

          <div className="transfer-selected-date">
            <strong>
              {formatSelectedDate(
                selectedDate,
                locale,
                text.noDate,
              )}
            </strong>

            <span>
              {
                filteredTransfers.length
              }{" "}
              {text.transfer}
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
          title={text.detail}
          subtitle={
            selectedTransfer
              ? selectedTransfer
                  .booking_reference
              : text.notSelected
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
              {text.emptyDetail}
            </div>
          )}
        </Card>

        <Card
          className="transfer-workspace-map"
          title={text.map}
          subtitle={text.mapSubtitle}
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
  locale,
  fallback,
) {
  const date = new Date(
    `${dateKey}T12:00:00`,
  );

  if (
    Number.isNaN(date.getTime())
  ) {
    return fallback;
  }

  return date.toLocaleDateString(
    locale,
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  );
}
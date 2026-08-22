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
import transferService from "../services/transferService";

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
    selectAll: "Uygunların Tümünü Seç",
    clearSelection: "Seçimi Temizle",
    sendSelectedToPool: "Seçilenleri Havuza Gönder",
    selectedCount: "seçili",
    poolEligibleCount: "havuza uygun",
    noSelection: "Havuza göndermek için en az bir transfer seçin.",
    poolError: "Toplu havuz işlemi başarısız oldu.",
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
    selectAll: "Select All Eligible",
    clearSelection: "Clear Selection",
    sendSelectedToPool: "Send Selected to Pool",
    selectedCount: "selected",
    poolEligibleCount: "pool eligible",
    noSelection: "Select at least one transfer to publish to the pool.",
    poolError: "Bulk pool operation failed.",
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
    selectAll: "تحديد كل المؤهلين",
    clearSelection: "مسح التحديد",
    sendSelectedToPool: "إرسال المحدد إلى المسبح",
    selectedCount: "محدد",
    poolEligibleCount: "مؤهل للمسبح",
    noSelection: "اختر تحويلاً واحداً على الأقل.",
    poolError: "فشلت عملية المسبح الجماعية.",
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
    selectAll: "Seleccionar todos los aptos",
    clearSelection: "Limpiar selección",
    sendSelectedToPool: "Enviar seleccionados al pool",
    selectedCount: "seleccionados",
    poolEligibleCount: "aptos para pool",
    noSelection: "Selecciona al menos un traslado.",
    poolError: "Falló la operación masiva del pool.",
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

  const [showExcelImport, setShowExcelImport] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getDateKey(new Date()));
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkPoolLoading, setBulkPoolLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkError, setBulkError] = useState("");

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

  const filteredTransfers = useMemo(() => {
    if (!Array.isArray(transfers)) return [];

    return transfers
      .filter(
        (transfer) =>
          getDateKey(transfer.pickup_time) === selectedDate,
      )
      .sort(
        (first, second) =>
          new Date(first.pickup_time).getTime() -
          new Date(second.pickup_time).getTime(),
      );
  }, [transfers, selectedDate]);

  const poolEligibleTransfers = useMemo(
    () => filteredTransfers.filter(isPoolSelectable),
    [filteredTransfers],
  );

  useEffect(() => {
    if (filteredTransfers.length === 0) {
      if (selectedTransfer) selectTransfer(null);
      return;
    }

    const selectedExists = filteredTransfers.some(
      (transfer) => Number(transfer.id) === Number(selectedTransfer?.id),
    );

    if (!selectedExists) {
      selectTransfer(filteredTransfers[0]);
    }
  }, [filteredTransfers, selectedTransfer, selectTransfer]);

  useEffect(() => {
    const eligibleIds = new Set(poolEligibleTransfers.map((transfer) => Number(transfer.id)));
    setSelectedIds((current) => current.filter((id) => eligibleIds.has(Number(id))));
  }, [poolEligibleTransfers]);

  async function handleImported() {
    await reload();
  }

  function goToPreviousDay() {
    setSelectedDate(shiftDate(selectedDate, -1));
    setSelectedIds([]);
  }

  function goToNextDay() {
    setSelectedDate(shiftDate(selectedDate, 1));
    setSelectedIds([]);
  }

  function goToToday() {
    setSelectedDate(getDateKey(new Date()));
    setSelectedIds([]);
  }

  function handleToggleSelect(transferId) {
    setBulkMessage("");
    setBulkError("");
    setSelectedIds((current) => {
      const numericId = Number(transferId);
      return current.some((id) => Number(id) === numericId)
        ? current.filter((id) => Number(id) !== numericId)
        : [...current, numericId];
    });
  }

  function handleSelectAll() {
    setBulkMessage("");
    setBulkError("");
    setSelectedIds(poolEligibleTransfers.map((transfer) => Number(transfer.id)));
  }

  async function handleBulkPublish() {
    if (selectedIds.length === 0) {
      setBulkError(text.noSelection);
      return;
    }

    setBulkPoolLoading(true);
    setBulkMessage("");
    setBulkError("");

    try {
      const result = await transferService.bulkPublishToJobPool(selectedIds);
      const skipped = Array.isArray(result?.data?.skipped) ? result.data.skipped : [];
      const skippedDetail = skipped.length
        ? ` ${skipped.slice(0, 3).map((item) => `${item.booking_reference || item.id}: ${item.reason}`).join(" | ")}`
        : "";

      setBulkMessage(`${result?.message || ""}${skippedDetail}`.trim());
      setSelectedIds([]);
      await reload();
    } catch (requestError) {
      setBulkError(
        requestError?.response?.data?.message ||
        requestError?.message ||
        text.poolError,
      );
    } finally {
      setBulkPoolLoading(false);
    }
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
              <Button size="sm" onClick={() => setShowExcelImport(true)}>
                {text.importExcel}
              </Button>

              <Button variant="ghost" size="sm" loading={loading} onClick={reload}>
                {text.refresh}
              </Button>
            </div>
          }
        >
          <div className="transfer-date-filter">
            <button type="button" onClick={goToPreviousDay} aria-label={text.previousDay}>‹</button>

            <label>
              <span>{text.operationDate}</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => {
                  setSelectedDate(event.target.value);
                  setSelectedIds([]);
                }}
              />
            </label>

            <button type="button" onClick={goToNextDay} aria-label={text.nextDay}>›</button>
            <button className="today" type="button" onClick={goToToday}>{text.today}</button>
          </div>

          <div className="transfer-selected-date">
            <strong>{formatSelectedDate(selectedDate, locale, text.noDate)}</strong>
            <span>{filteredTransfers.length} {text.transfer}</span>
          </div>

          <div
            className="transfer-bulk-pool-bar"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              alignItems: "center",
              margin: "10px 0 12px",
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              disabled={poolEligibleTransfers.length === 0 || bulkPoolLoading}
              onClick={handleSelectAll}
            >
              {text.selectAll}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              disabled={selectedIds.length === 0 || bulkPoolLoading}
              onClick={() => setSelectedIds([])}
            >
              {text.clearSelection}
            </Button>

            <Button
              size="sm"
              loading={bulkPoolLoading}
              disabled={selectedIds.length === 0}
              onClick={handleBulkPublish}
            >
              {text.sendSelectedToPool} ({selectedIds.length})
            </Button>

            <span style={{ fontSize: "12px", opacity: 0.75 }}>
              {selectedIds.length} {text.selectedCount} · {poolEligibleTransfers.length} {text.poolEligibleCount}
            </span>
          </div>

          {bulkMessage ? (
            <div style={{ marginBottom: "10px", fontSize: "12px", color: "#57d9a3" }}>
              {bulkMessage}
            </div>
          ) : null}

          {bulkError ? (
            <div style={{ marginBottom: "10px", fontSize: "12px", color: "#ff7b7b" }}>
              {bulkError}
            </div>
          ) : null}

          <TransferList
            transfers={filteredTransfers}
            loading={loading}
            error={error}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            isSelectable={isPoolSelectable}
          />
        </Card>

        <Card
          className="transfer-workspace-detail"
          title={text.detail}
          subtitle={selectedTransfer ? selectedTransfer.booking_reference : text.notSelected}
          actions={selectedTransfer ? <StatusBadge status={selectedTransfer.status} /> : null}
        >
          {selectedTransfer ? (
            <TransferDetail />
          ) : (
            <div className="transfer-detail-empty">{text.emptyDetail}</div>
          )}
        </Card>

        <Card className="transfer-workspace-map" title={text.map} subtitle={text.mapSubtitle}>
          <LiveTransferSync />
          <LiveOperationMap />
        </Card>

        <section className="transfer-workspace-timeline">
          <TimelineCard />
        </section>
      </main>

      <TransferExcelImportModal
        open={showExcelImport}
        onClose={() => setShowExcelImport(false)}
        onImported={handleImported}
      />
    </>
  );
}

function isPoolSelectable(transfer) {
  return transfer?.status === "pending"
    && !transfer?.supplier_id
    && !transfer?.job_pool_published_at;
}

function getDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDate(dateKey, amount) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return getDateKey(date);
}

function formatSelectedDate(dateKey, locale, fallback) {
  const date = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleDateString(locale, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

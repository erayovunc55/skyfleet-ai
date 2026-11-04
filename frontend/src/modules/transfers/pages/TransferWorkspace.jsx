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
  const [search, setSearch] = useState("");
  const [view, setView] = useState("all");
  const [showMap, setShowMap] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

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

  const counts = useMemo(() => ({
    all: filteredTransfers.length,
    unassigned: filteredTransfers.filter((t) => !t.driver_id && !t.driver?.id && !["completed", "cancelled", "canceled"].includes(t.status)).length,
    active: filteredTransfers.filter((t) => ["accepted", "on_the_way", "arrived", "passenger_called", "passenger_on_board", "trip_started", "in_progress"].includes(t.status)).length,
    completed: filteredTransfers.filter((t) => t.status === "completed").length,
  }), [filteredTransfers]);

  const visibleTransfers = useMemo(() => filteredTransfers.filter((t) => {
    if (view === "unassigned" && (t.driver_id || t.driver?.id || ["completed", "cancelled", "canceled"].includes(t.status))) return false;
    if (view === "active" && !["accepted", "on_the_way", "arrived", "passenger_called", "passenger_on_board", "trip_started", "in_progress"].includes(t.status)) return false;
    if (view === "completed" && t.status !== "completed") return false;
    const haystack = [t.booking_reference, t.passenger_name, t.customer_name, t.flight_number, t.pickup_address, t.dropoff_address, t.pickup_location?.name, t.dropoff_location?.name, t.driver?.name, t.driver_name].filter(Boolean).join(" ").toLocaleLowerCase();
    return haystack.includes(search.trim().toLocaleLowerCase());
  }), [filteredTransfers, view, search]);

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
      <style>{`
        .ct2{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(360px,1fr);gap:14px;align-items:start;min-width:0}
        .ct2 *{box-sizing:border-box}.ct2-left,.ct2-right{min-width:0}.ct2-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:12px 0}.ct2-input{background:#081a2d;border:1px solid #244463;color:#eef7ff;border-radius:8px;padding:9px 11px;min-width:160px;flex:1}.ct2-pill{background:#0c2740;color:#b9dfff;border:1px solid #234768;border-radius:8px;padding:8px 10px;cursor:pointer;font-size:12px}.ct2-pill[data-active="true"]{background:#12609a;color:white;border-color:#249bdf}.ct2-stats{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}.ct2-table-wrap{overflow:auto;max-height:calc(100vh - 340px);min-height:280px;border:1px solid #203b58;border-radius:10px}.ct2-table{border-collapse:collapse;width:100%;font-size:12px;white-space:nowrap}.ct2-table th{position:sticky;top:0;background:#10243d;color:#8eb8d7;text-align:left;font-weight:600;padding:11px 9px;z-index:1}.ct2-table td{padding:9px;border-top:1px solid #1d334d;color:#e7f3ff}.ct2-table tr[data-selected="true"]{background:#11365b}.ct2-table tbody tr:hover{background:#16324f;cursor:pointer}.ct2-muted{color:#8ba9c6;font-size:11px}.ct2-cell-main{font-weight:600}.ct2-check{accent-color:#16b3ed}.ct2-detail{max-height:calc(100vh - 150px);overflow:auto}.ct2-footer{grid-column:1/-1}.ct2-alert{font-size:12px;margin:8px 0}.ct2-toggle{display:flex;gap:8px;flex-wrap:wrap}.ct2-empty{padding:28px;text-align:center;color:#9ab7d3}@media(max-width:1100px){.ct2{grid-template-columns:minmax(0,1fr)}.ct2-detail{max-height:none}.ct2-table-wrap{max-height:60vh}}
      `}</style>
      <LiveTransferSync />
      <main className="ct2">
        <div className="ct2-left">
          <Card title={language === "tr" ? "Operasyon Kontrol Kulesi" : "Operations Control Tower"} subtitle={`${filteredTransfers.length} ${text.transfer}`} actions={<div className="transfer-workspace-actions"><Button size="sm" onClick={() => setShowExcelImport(true)}>{text.importExcel}</Button><Button variant="ghost" size="sm" loading={loading} onClick={reload}>{text.refresh}</Button></div>}>
            <div className="transfer-date-filter">
              <button type="button" onClick={goToPreviousDay} aria-label={text.previousDay}>‹</button>
              <label><span>{text.operationDate}</span><input type="date" value={selectedDate} onChange={(event) => {setSelectedDate(event.target.value);setSelectedIds([]);}} /></label>
              <button type="button" onClick={goToNextDay} aria-label={text.nextDay}>›</button>
              <button type="button" className="today" onClick={goToToday}>{text.today}</button>
            </div>
            <div className="ct2-stats">
              {[ ["all", language === "tr" ? "Tümü" : "All", counts.all], ["unassigned", language === "tr" ? "Sürücüsüz" : "Unassigned", counts.unassigned], ["active", language === "tr" ? "Aktif" : "Active", counts.active], ["completed", language === "tr" ? "Tamamlanan" : "Completed", counts.completed] ].map(([key,label,count]) => <button key={key} type="button" className="ct2-pill" data-active={view === key} onClick={() => setView(key)}>{label} · {count}</button>)}
            </div>
            <div className="ct2-toolbar">
              <input className="ct2-input" aria-label={language === "tr" ? "Transfer ara" : "Search transfers"} placeholder={language === "tr" ? "Rezervasyon, yolcu, uçuş, adres ara..." : "Search booking, passenger, flight, address..."} value={search} onChange={(e) => setSearch(e.target.value)} />
              <button type="button" className="ct2-pill" onClick={() => setShowMap((v) => !v)}>{showMap ? "−" : "+"} {text.map}</button>
              <button type="button" className="ct2-pill" onClick={() => setShowTimeline((v) => !v)}>{language === "tr" ? "Zaman Çizelgesi" : "Timeline"}</button>
            </div>
            <div className="ct2-toolbar">
              <Button variant="ghost" size="sm" disabled={!poolEligibleTransfers.length || bulkPoolLoading} onClick={handleSelectAll}>{text.selectAll}</Button>
              <Button variant="ghost" size="sm" disabled={!selectedIds.length || bulkPoolLoading} onClick={() => setSelectedIds([])}>{text.clearSelection}</Button>
              <Button size="sm" loading={bulkPoolLoading} disabled={!selectedIds.length || bulkPoolLoading} onClick={handleBulkPublish}>{text.sendSelectedToPool} ({selectedIds.length})</Button>
              <span className="ct2-muted">{selectedIds.length} {text.selectedCount} · {poolEligibleTransfers.length} {text.poolEligibleCount}</span>
            </div>
            {bulkMessage && <div className="ct2-alert" style={{color:"#57d9a3"}}>{bulkMessage}</div>}
            {bulkError && <div className="ct2-alert" style={{color:"#ff7b7b"}}>{bulkError}</div>}
            {error && <div role="alert" className="ct2-alert" style={{color:"#ff7b7b"}}>{String(error?.message || error)}</div>}
            <div className="ct2-table-wrap">
              <table className="ct2-table"><thead><tr><th aria-label="Pool selection">✓</th><th>{language === "tr" ? "Saat" : "Time"}</th><th>{language === "tr" ? "Rezervasyon / Yolcu" : "Booking / Passenger"}</th><th>{language === "tr" ? "Güzergâh" : "Route"}</th><th>{language === "tr" ? "Uçuş" : "Flight"}</th><th>{language === "tr" ? "Sürücü" : "Driver"}</th><th>{language === "tr" ? "Durum" : "Status"}</th></tr></thead>
              <tbody>{visibleTransfers.map((t) => <tr key={t.id} data-selected={Number(selectedTransfer?.id) === Number(t.id)} onClick={() => selectTransfer(t)}>
                <td onClick={(e) => e.stopPropagation()}><input className="ct2-check" type="checkbox" aria-label={`${t.booking_reference || t.id} ${text.selectAll}`} checked={selectedIds.some((id) => Number(id) === Number(t.id))} disabled={!isPoolSelectable(t) || bulkPoolLoading} onChange={() => handleToggleSelect(t.id)} /></td>
                <td className="ct2-cell-main">{formatTime(t.pickup_time, locale)}</td>
                <td><div className="ct2-cell-main">{t.booking_reference || `#${t.id}`}</div><div className="ct2-muted">{t.passenger_name || t.customer_name || "—"}</div></td>
                <td title={`${getPlace(t,"pickup")} → ${getPlace(t,"dropoff")}`}><div className="ct2-cell-main">{shorten(getPlace(t,"pickup"),22)} → {shorten(getPlace(t,"dropoff"),22)}</div></td>
                <td>{t.flight_number || "—"}</td><td>{t.driver?.name || t.driver_name || (t.driver_id ? `#${t.driver_id}` : "—")}</td><td><StatusBadge status={t.status || "pending"}/></td>
              </tr>)}</tbody></table>
              {!loading && !visibleTransfers.length && <div className="ct2-empty">{text.emptyDetail}</div>}
              {loading && !visibleTransfers.length && <div className="ct2-empty">{language === "tr" ? "Yükleniyor..." : "Loading..."}</div>}
            </div>
          </Card>
        </div>
        <div className="ct2-right"><Card className="ct2-detail" title={text.detail} subtitle={selectedTransfer?.booking_reference || text.notSelected} actions={selectedTransfer ? <StatusBadge status={selectedTransfer.status}/> : null}>{selectedTransfer ? <TransferDetail/> : <div className="transfer-detail-empty">{text.emptyDetail}</div>}</Card></div>
        {(showMap || showTimeline) && <div className="ct2-footer">{showMap && <Card title={text.map} subtitle={text.mapSubtitle}><LiveOperationMap /></Card>}{showTimeline && <section className="transfer-workspace-timeline"><TimelineCard /></section>}</div>}
      </main>
      <TransferExcelImportModal open={showExcelImport} onClose={() => setShowExcelImport(false)} onImported={handleImported} />
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

function shorten(value, max) {
  const text = String(value || "—");
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
function getPlace(transfer, kind) {
  const value = transfer?.[`${kind}_location`];
  return transfer?.[`${kind}_address`] || (typeof value === "string" ? value : value?.name || value?.address) || transfer?.[`${kind}_name`] || "—";
}
function formatTime(value, locale) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleTimeString(locale, {hour:"2-digit", minute:"2-digit"});
}

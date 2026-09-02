import { useEffect, useMemo, useState } from "react";

import CreateTransferPage from "./CreateTransferPage";
import TransferCommercialSummary from "../modules/transfers/components/TransferCommercialSummary";
import TransferSupplierAssignment from "../modules/transfers/components/TransferSupplierAssignment";
import supplierService from "../modules/suppliers/services/supplierService";
import transferService from "../modules/transfers/services/transferService";
import TransferDetail from "../modules/transfers/components/TransferDetail";
import TransferEvidenceCard from "../modules/transfers/components/TransferEvidenceCard";
import {
  CancelTransferModal,
  EditTransferModal,
} from "../modules/transfers/components/TransferManagementModals";
import useTransfer from "../modules/transfers/hooks/useTransfer";
import useTransfers from "../modules/transfers/hooks/useTransfers";

const ALERT_TRANSFER_KEY = "skyfleet_pending_transfer_id";
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const STATUS_OPTIONS = [
  { value: "all", label: "Tüm durumlar" },
  { value: "pending", label: "Bekliyor" },
  { value: "accepted", label: "Kabul Edildi" },
  { value: "on_the_way", label: "Yolda" },
  { value: "arrived", label: "Alış Noktasında" },
  { value: "passenger_called", label: "Yolcu Arandı" },
  { value: "passenger_on_board", label: "Yolcu Araçta" },
  { value: "trip_started", label: "Transfer Başladı" },
  { value: "completed", label: "Tamamlandı" },
  { value: "no_show", label: "No Show" },
  { value: "cancelled", label: "İptal" },
];

const EMPTY_COLUMN_FILTERS = {
  ref: "all",
  supplier: "all",
  type: "all",
  date: "all",
  time: "all",
  flight: "all",
  from: "all",
  to: "all",
  passenger: "all",
  phone: "all",
  pax: "all",
  child: "all",
  vehicleType: "all",
  price: "all",
  currency: "all",
  vehicle: "all",
  driver: "all",
  assignment: "all",
  status: "all",
};

export default function TransfersPage() {
  const { transfers, loading, error, reload } = useTransfers();
  const { selectedTransfer, selectTransfer, clearSelectedTransfer } = useTransfer();

  const [showCreatePage, setShowCreatePage] = useState(false);
  const [selectedTransferIds, setSelectedTransferIds] = useState([]);
  const [bulkSupplierId, setBulkSupplierId] = useState("");
  const [bulkSuppliers, setBulkSuppliers] = useState([]);
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [bulkAssignMessage, setBulkAssignMessage] = useState("");
  const [bulkAssignError, setBulkAssignError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [columnFilters, setColumnFilters] = useState(EMPTY_COLUMN_FILTERS);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let active = true;

    async function openTransfer(transferId) {
      const numericId = Number(transferId);
      if (!numericId) return;

      setSearch("");
      setStatus("all");
      setSupplierFilter("all");
      setStartDate("");
      setEndDate("");
      setColumnFilters(EMPTY_COLUMN_FILTERS);
      setCurrentPage(1);
      setShowCreatePage(false);

      let transfer = transfers.find((item) => Number(item.id) === numericId);
      if (!transfer) {
        try {
          transfer = await transferService.getTransfer(numericId);
        } catch (requestError) {
          console.error("Bildirim transferi açılamadı:", requestError);
          return;
        }
      }

      if (!active || !transfer) return;
      selectTransfer(transfer);
      sessionStorage.removeItem(ALERT_TRANSFER_KEY);

      window.requestAnimationFrame(() => {
        document.querySelector(".transfers-detail-panel")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }

    function handleOpenTransfer(event) {
      openTransfer(event?.detail?.transferId);
    }

    window.addEventListener("skyfleet:open-transfer", handleOpenTransfer);
    const pendingTransferId = sessionStorage.getItem(ALERT_TRANSFER_KEY);
    if (pendingTransferId) openTransfer(pendingTransferId);

    return () => {
      active = false;
      window.removeEventListener("skyfleet:open-transfer", handleOpenTransfer);
    };
  }, [transfers, selectTransfer]);

  useEffect(() => {
    let active = true;

    async function loadBulkSuppliers() {
      try {
        const response = await supplierService.getSuppliers({
          status: "approved",
          is_active: 1,
          per_page: 100,
        });
        const items = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];
        if (active) setBulkSuppliers(items);
      } catch (requestError) {
        if (active) {
          setBulkAssignError(
            requestError?.response?.data?.message ||
              requestError?.message ||
              "Tedarikçiler yüklenemedi.",
          );
        }
      }
    }

    loadBulkSuppliers();
    return () => { active = false; };
  }, []);

  const columnOptions = useMemo(() => ({
    ref: makeOptions(transfers, (t) => t.booking_reference),
    supplier: makeOptions(transfers, getSupplierLabel),
    type: [
      ["all", "Tümü"],
      ["airport-pickup", "Airport Pickup"],
      ["airport-dropoff", "Airport Dropoff"],
      ["standard", "Point to Point"],
    ],
    date: makeOptions(transfers, (t) => getDateKey(t.pickup_time), (value) => formatDate(value)),
    time: makeOptions(transfers, (t) => formatTime(t.pickup_time)),
    flight: makeOptions(transfers, (t) => t.flight_number || "—"),
    from: makeOptions(transfers, (t) => t.pickup || "—"),
    to: makeOptions(transfers, (t) => t.dropoff || "—"),
    passenger: makeOptions(transfers, (t) => t.passenger_name || "—"),
    phone: makeOptions(transfers, (t) => t.passenger_phone || "—"),
    pax: makeOptions(transfers, getPassengerCount),
    child: makeOptions(transfers, getChildCount),
    vehicleType: makeOptions(transfers, (t) => t.vehicle_type || "—"),
    price: makeOptions(transfers, (t) => formatPriceOnly(t.price)),
    currency: makeOptions(transfers, (t) => formatCurrency(t.currency)),
    vehicle: makeOptions(transfers, getVehiclePlate),
    driver: makeOptions(transfers, getDriverName),
    assignment: [
      ["all", "Tümü"],
      ["supplier", "Tedarikçi bekleniyor"],
      ["resources", "Araç / sürücü bekleniyor"],
      ["driver", "Sürücü kabulü bekleniyor"],
      ["ready", "Atama tamam"],
    ],
    status: STATUS_OPTIONS.map((item) => [item.value, item.label]),
  }), [transfers]);

  const filteredTransfers = useMemo(() => {
    const searchValue = normalize(search);

    return [...transfers]
      .filter((transfer) => {
        if (status !== "all" && transfer.status !== status) return false;
        if (
          supplierFilter !== "all" &&
          Number(transfer.supplier_id || 0) !== Number(supplierFilter)
        ) return false;

        const pickupDate = getDateKey(transfer.pickup_time);
        if (startDate && (!pickupDate || pickupDate < startDate)) return false;
        if (endDate && (!pickupDate || pickupDate > endDate)) return false;

        if (searchValue) {
          const searchableText = normalize([
            transfer.booking_reference,
            transfer.ota_booking_reference,
            transfer.passenger_name,
            transfer.passenger_phone,
            transfer.passenger_email,
            transfer.flight_number,
            transfer.pickup,
            transfer.dropoff,
            transfer.driver?.name,
            transfer.supplier_company?.company_name,
            transfer.supplier,
            transfer.ota_source,
          ].filter(Boolean).join(" "));
          if (!searchableText.includes(searchValue)) return false;
        }

        return matchesColumnFilters(transfer, columnFilters);
      })
      .sort(
        (first, second) =>
          getTimestamp(first.pickup_time) - getTimestamp(second.pickup_time),
      );
  }, [transfers, search, status, supplierFilter, startDate, endDate, columnFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredTransfers.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, status, supplierFilter, startDate, endDate, columnFilters, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedTransfers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTransfers.slice(startIndex, startIndex + pageSize);
  }, [filteredTransfers, currentPage, pageSize]);

  const statistics = useMemo(() => ({
    total: transfers.length,
    waiting: transfers.filter((transfer) => transfer.status === "pending").length,
    active: transfers.filter((transfer) => [
      "accepted",
      "on_the_way",
      "arrived",
      "passenger_called",
      "passenger_on_board",
      "trip_started",
    ].includes(transfer.status)).length,
    completed: transfers.filter((transfer) => transfer.status === "completed").length,
  }), [transfers]);

  const selectableTransferIds = useMemo(
    () => paginatedTransfers
      .filter((transfer) =>
        !transfer.supplier_id && ["pending", "accepted"].includes(transfer.status),
      )
      .map((transfer) => Number(transfer.id)),
    [paginatedTransfers],
  );

  const allVisibleSelected =
    selectableTransferIds.length > 0 &&
    selectableTransferIds.every((id) => selectedTransferIds.includes(id));

  useEffect(() => {
    if (
      selectedTransfer &&
      !filteredTransfers.some(
        (transfer) => Number(transfer.id) === Number(selectedTransfer.id),
      )
    ) {
      clearSelectedTransfer();
    }
  }, [filteredTransfers, selectedTransfer, clearSelectedTransfer]);

  function setColumnFilter(key, value) {
    setColumnFilters((current) => ({ ...current, [key]: value }));
  }

  function clearFilters() {
    setSearch("");
    setStatus("all");
    setSupplierFilter("all");
    setStartDate("");
    setEndDate("");
    setColumnFilters(EMPTY_COLUMN_FILTERS);
    setCurrentPage(1);
  }

  async function handleTransferSaved(updatedTransfer) {
    selectTransfer(updatedTransfer);
    setShowEditModal(false);
    await reload();
  }

  async function handleTransferCancelled(cancelledTransfer) {
    selectTransfer(cancelledTransfer);
    setShowCancelModal(false);
    await reload();
  }

  async function handleBulkPublishToJobPool() {
    if (selectedTransferIds.length === 0) return;

    setBulkAssigning(true);
    setBulkAssignMessage("");
    setBulkAssignError("");

    try {
      const result = await transferService.bulkPublishToJobPool(
        selectedTransferIds,
      );

      const publishedCount = result?.published_count ?? result?.updated_count ?? 0;
      const skippedCount = result?.skipped_count ?? 0;

      let message = `${publishedCount} transfer iş havuzuna gönderildi.`;
      if (skippedCount > 0) {
        message += ` ${skippedCount} transfer atlandı.`;
      }

      setBulkAssignMessage(message);
      setSelectedTransferIds([]);
      await reload();
    } catch (requestError) {
      setBulkAssignError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Transferler iş havuzuna gönderilemedi.",
      );
    } finally {
      setBulkAssigning(false);
    }
  }

  async function handleBulkAssignSupplier() {
    if (selectedTransferIds.length === 0 || !bulkSupplierId) return;

    setBulkAssigning(true);
    setBulkAssignMessage("");
    setBulkAssignError("");

    try {
      const result = await transferService.bulkAssignSupplier(
        selectedTransferIds,
        bulkSupplierId,
      );
      setBulkAssignMessage(`${result?.updated_count || 0} transfer tedarikçiye atandı.`);
      setSelectedTransferIds([]);
      setBulkSupplierId("");
      await reload();
    } catch (requestError) {
      setBulkAssignError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Toplu tedarikçi ataması yapılamadı.",
      );
    } finally {
      setBulkAssigning(false);
    }
  }

  function toggleTransferSelection(transferId) {
    setSelectedTransferIds((current) => {
      const id = Number(transferId);
      return current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
    });
  }

  function selectAllVisibleTransfers() {
    setSelectedTransferIds((current) => [
      ...new Set([...current, ...selectableTransferIds]),
    ]);
  }

  function clearTransferSelection() {
    setSelectedTransferIds([]);
  }

  function handleCloseDetail() {
    setShowEditModal(false);
    setShowCancelModal(false);
    clearSelectedTransfer();
  }

  if (showCreatePage) {
    return (
      <CreateTransferPage
        onCancel={() => setShowCreatePage(false)}
        onCreated={async () => {
          setShowCreatePage(false);
          await reload();
        }}
      />
    );
  }

  const firstVisible = filteredTransfers.length === 0
    ? 0
    : (currentPage - 1) * pageSize + 1;
  const lastVisible = Math.min(currentPage * pageSize, filteredTransfers.length);

  return (
    <main className="transfers-management-page">
      <header className="transfers-management-header">
        <div>
          <span className="transfers-management-eyebrow">OPERASYON</span>
          <h1>Transfer Yönetimi</h1>
          <p>Geçmiş ve ileri tarihli bütün rezervasyonları tek ekrandan yönetin.</p>
        </div>
        <div className="transfers-management-actions">
          <button type="button" className="transfers-secondary-button" onClick={reload} disabled={loading}>
            {loading ? "Yükleniyor..." : "Yenile"}
          </button>
          <button type="button" className="transfers-primary-button" onClick={() => setShowCreatePage(true)}>
            + Yeni Transfer
          </button>
        </div>
      </header>

      <section className="transfers-statistics">
        <StatisticCard label="Toplam Transfer" value={statistics.total} />
        <StatisticCard label="Bekleyen" value={statistics.waiting} />
        <StatisticCard label="Aktif Operasyon" value={statistics.active} />
        <StatisticCard label="Tamamlanan" value={statistics.completed} />
      </section>

      <section className="transfers-filter-card transfers-filter-card-extended">
        <div className="transfers-filter-search">
          <label htmlFor="transfer-search">Transfer ara</label>
          <input
            id="transfer-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ref no, yolcu, telefon, uçuş veya adres..."
          />
        </div>
        <div className="transfers-filter-field">
          <label htmlFor="transfer-supplier-filter">Tedarikçi</label>
          <select id="transfer-supplier-filter" value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)}>
            <option value="all">Tüm tedarikçiler</option>
            {bulkSuppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>{supplier.company_name}</option>
            ))}
          </select>
        </div>
        <div className="transfers-filter-field">
          <label htmlFor="transfer-status">Durum</label>
          <select id="transfer-status" value={status} onChange={(event) => setStatus(event.target.value)}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="transfers-filter-field">
          <label htmlFor="transfer-start-date">Başlangıç</label>
          <input id="transfer-start-date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </div>
        <div className="transfers-filter-field">
          <label htmlFor="transfer-end-date">Bitiş</label>
          <input id="transfer-end-date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </div>
        <button type="button" className="transfers-clear-button" onClick={clearFilters}>Filtreleri Temizle</button>
      </section>

      {error && <div className="transfers-management-error">{error}</div>}

      <section className="transfers-management-content">
        <div className="transfers-table-card">
          <div className="transfers-table-heading">
            <div>
              <h2>Rezervasyonlar</h2>
              <span>{filteredTransfers.length} kayıt • {firstVisible}-{lastVisible} gösteriliyor</span>
            </div>
            <div className="transfers-bulk-assignment">
              <span>{selectedTransferIds.length} transfer seçildi</span>
              <button
                type="button"
                disabled={bulkAssigning || selectedTransferIds.length === 0}
                onClick={handleBulkPublishToJobPool}
              >
                {bulkAssigning ? "İşlem yapılıyor..." : "Havuza Gönder"}
              </button>
              <select
                value={bulkSupplierId}
                disabled={bulkAssigning || selectedTransferIds.length === 0}
                onChange={(event) => {
                  setBulkSupplierId(event.target.value);
                  setBulkAssignMessage("");
                  setBulkAssignError("");
                }}
                aria-label="Toplu atanacak tedarikçi"
              >
                <option value="">Tedarikçi seçin</option>
                {bulkSuppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.company_name}{supplier.city ? ` — ${supplier.city}` : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={bulkAssigning || selectedTransferIds.length === 0 || !bulkSupplierId}
                onClick={handleBulkAssignSupplier}
              >
                {bulkAssigning ? "Atanıyor..." : "Toplu Ata"}
              </button>
              {selectedTransferIds.length > 0 && (
                <button type="button" onClick={clearTransferSelection} disabled={bulkAssigning}>Seçimi Temizle</button>
              )}
            </div>
          </div>

          {bulkAssignMessage && <div className="transfers-bulk-message success">{bulkAssignMessage}</div>}
          {bulkAssignError && <div className="transfers-bulk-message error">{bulkAssignError}</div>}

          {loading ? (
            <div className="transfers-table-state">Transferler yükleniyor...</div>
          ) : filteredTransfers.length === 0 ? (
            <div className="transfers-table-state">Seçilen filtrelere uygun transfer bulunamadı.</div>
          ) : (
            <>
              <div className="transfers-table-wrapper">
                <table className="transfers-table">
                  <thead>
                    <tr>
                      <th className="transfers-select-column">
                        <input
                          type="checkbox"
                          aria-label="Bu sayfadaki uygun transferlerin tümünü seç"
                          checked={allVisibleSelected}
                          disabled={selectableTransferIds.length === 0}
                          onChange={(event) => event.target.checked ? selectAllVisibleTransfers() : clearTransferSelection()}
                          onClick={(event) => event.stopPropagation()}
                        />
                      </th>
                      <th>Ref. No</th><th>Tedarikçi</th><th>Tür</th><th>Tarih</th><th>Saat</th><th>Uçuş</th>
                      <th>Nereden</th><th>Nereye</th><th>Yolcu</th><th>Telefon</th><th>Pax</th><th>Çocuk</th>
                      <th>Araç Tipi</th><th>Fiyat</th><th>Para Birimi</th><th>Araç</th><th>Sürücü</th><th>Atama</th><th>Durum</th>
                    </tr>
                    <tr className="transfers-column-filter-row">
                      <th />
                      <FilterSelect value={columnFilters.ref} onChange={(value) => setColumnFilter("ref", value)} options={columnOptions.ref} />
                      <FilterSelect value={columnFilters.supplier} onChange={(value) => setColumnFilter("supplier", value)} options={columnOptions.supplier} />
                      <FilterSelect value={columnFilters.type} onChange={(value) => setColumnFilter("type", value)} options={columnOptions.type} />
                      <FilterSelect value={columnFilters.date} onChange={(value) => setColumnFilter("date", value)} options={columnOptions.date} />
                      <FilterSelect value={columnFilters.time} onChange={(value) => setColumnFilter("time", value)} options={columnOptions.time} />
                      <FilterSelect value={columnFilters.flight} onChange={(value) => setColumnFilter("flight", value)} options={columnOptions.flight} />
                      <FilterSelect value={columnFilters.from} onChange={(value) => setColumnFilter("from", value)} options={columnOptions.from} />
                      <FilterSelect value={columnFilters.to} onChange={(value) => setColumnFilter("to", value)} options={columnOptions.to} />
                      <FilterSelect value={columnFilters.passenger} onChange={(value) => setColumnFilter("passenger", value)} options={columnOptions.passenger} />
                      <FilterSelect value={columnFilters.phone} onChange={(value) => setColumnFilter("phone", value)} options={columnOptions.phone} />
                      <FilterSelect value={columnFilters.pax} onChange={(value) => setColumnFilter("pax", value)} options={columnOptions.pax} />
                      <FilterSelect value={columnFilters.child} onChange={(value) => setColumnFilter("child", value)} options={columnOptions.child} />
                      <FilterSelect value={columnFilters.vehicleType} onChange={(value) => setColumnFilter("vehicleType", value)} options={columnOptions.vehicleType} />
                      <FilterSelect value={columnFilters.price} onChange={(value) => setColumnFilter("price", value)} options={columnOptions.price} />
                      <FilterSelect value={columnFilters.currency} onChange={(value) => setColumnFilter("currency", value)} options={columnOptions.currency} />
                      <FilterSelect value={columnFilters.vehicle} onChange={(value) => setColumnFilter("vehicle", value)} options={columnOptions.vehicle} />
                      <FilterSelect value={columnFilters.driver} onChange={(value) => setColumnFilter("driver", value)} options={columnOptions.driver} />
                      <FilterSelect value={columnFilters.assignment} onChange={(value) => setColumnFilter("assignment", value)} options={columnOptions.assignment} />
                      <FilterSelect value={columnFilters.status} onChange={(value) => setColumnFilter("status", value)} options={columnOptions.status} />
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransfers.map((transfer) => (
                      <TransferTableRow
                        key={transfer.id}
                        transfer={transfer}
                        active={Number(selectedTransfer?.id) === Number(transfer.id)}
                        selected={selectedTransferIds.includes(Number(transfer.id))}
                        onToggleSelection={() => toggleTransferSelection(transfer.id)}
                        onSelect={() => selectTransfer(transfer)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="transfers-pagination">
                <div className="transfers-page-size">
                  <span>Sayfa başına</span>
                  <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} aria-label="Sayfa başına transfer sayısı">
                    {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
                  </select>
                  <span>transfer</span>
                </div>
                <div className="transfers-pagination-summary">{firstVisible}-{lastVisible} / {filteredTransfers.length}</div>
                <div className="transfers-pagination-actions">
                  <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>‹ Önceki</button>
                  <span>Sayfa <strong>{currentPage}</strong> / {totalPages}</span>
                  <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>Sonraki ›</button>
                </div>
              </div>
            </>
          )}
        </div>

        {selectedTransfer && (
          <aside className="transfers-detail-panel">
            <div className="transfers-detail-panel-header">
              <div className="transfers-detail-panel-title">
                <span>TRANSFER DETAYI</span>
                <h2>{selectedTransfer.booking_reference || `Transfer #${selectedTransfer.id}`}</h2>
              </div>
              <div className="transfers-detail-panel-actions">
                {canEditTransfer(selectedTransfer) && (
                  <button type="button" className="transfers-detail-edit-button" onClick={() => setShowEditModal(true)}>Düzenle</button>
                )}
                {canCancelTransfer(selectedTransfer) && (
                  <button type="button" className="transfers-detail-cancel-button" onClick={() => setShowCancelModal(true)}>İptal Et</button>
                )}
                <button type="button" className="transfers-detail-close-button" aria-label="Transfer detayını kapat" onClick={handleCloseDetail}>×</button>
              </div>
            </div>

            {selectedTransfer.status === "cancelled" && (
              <div className="transfer-cancelled-notice">
                <strong>Bu transfer iptal edilmiştir.</strong>
                <span>{selectedTransfer.cancellation_reason || "İptal nedeni belirtilmedi."}</span>
                {selectedTransfer.cancelled_at && <small>{formatDateTime(selectedTransfer.cancelled_at)}</small>}
              </div>
            )}

            <>
              <TransferCommercialSummary transfer={selectedTransfer} />
              <TransferEvidenceCard transfer={selectedTransfer} />
              <TransferSupplierAssignment transfer={selectedTransfer} onAssigned={handleTransferSaved} />
              <TransferDetail />
            </>
          </aside>
        )}
      </section>

      {showEditModal && selectedTransfer && (
        <EditTransferModal transfer={selectedTransfer} onClose={() => setShowEditModal(false)} onSaved={handleTransferSaved} />
      )}
      {showCancelModal && selectedTransfer && (
        <CancelTransferModal transfer={selectedTransfer} onClose={() => setShowCancelModal(false)} onCancelled={handleTransferCancelled} />
      )}
    </main>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <th className="transfers-column-filter-cell">
      <select value={value} onChange={(event) => onChange(event.target.value)} onClick={(event) => event.stopPropagation()}>
        {options.map(([optionValue, label]) => (
          <option key={`${optionValue}-${label}`} value={optionValue}>{label}</option>
        ))}
      </select>
    </th>
  );
}

function StatisticCard({ label, value }) {
  return <article className="transfers-statistic-card"><span>{label}</span><strong>{value}</strong></article>;
}

function TransferTableRow({ transfer, active, selected, onToggleSelection, onSelect }) {
  const selectable = !transfer.supplier_id && ["pending", "accepted"].includes(transfer.status);
  const transferDirection = getTransferDirection(transfer);
  const assignmentState = getAssignmentState(transfer);
  const rowClassName = [
    "transfers-table-row",
    `transfers-table-row-${transferDirection}`,
    active ? "active" : "",
    selected ? "selected" : "",
  ].filter(Boolean).join(" ");

  return (
    <tr className={rowClassName} onClick={onSelect}>
      <td className="transfers-select-column"><input type="checkbox" checked={selected} disabled={!selectable} aria-label={`${transfer.booking_reference || `Transfer ${transfer.id}`} seç`} onChange={onToggleSelection} onClick={(event) => event.stopPropagation()} /></td>
      <td><button type="button" className="transfers-reference-button" onClick={onSelect}>{transfer.booking_reference || `#${transfer.id}`}</button></td>
      <td><strong>{getSupplierLabel(transfer)}</strong><small>{transfer.ota_source || "Manuel"}</small></td>
      <td><span className={`transfers-service-type transfers-service-type-${transferDirection}`}>{getTransferDirectionLabel(transferDirection)}</span></td>
      <td className="transfers-date-cell"><strong>{formatDate(transfer.pickup_time)}</strong></td>
      <td className="transfers-time-cell"><strong>{formatTime(transfer.pickup_time)}</strong></td>
      <td><strong>{transfer.flight_number || "—"}</strong></td>
      <td className="transfers-address-cell"><span title={transfer.pickup || ""}>{transfer.pickup || "Alış noktası yok"}</span></td>
      <td className="transfers-address-cell"><span title={transfer.dropoff || ""}>{transfer.dropoff || "Bırakış noktası yok"}</span></td>
      <td className="transfers-passenger-cell"><strong>{transfer.passenger_name || "Yolcu belirtilmedi"}</strong></td>
      <td className="transfers-phone-cell"><span>{transfer.passenger_phone || "—"}</span></td>
      <td className="transfers-pax-cell"><strong>{getPassengerCount(transfer)}</strong></td>
      <td className="transfers-pax-cell"><strong>{getChildCount(transfer)}</strong></td>
      <td className="transfers-vehicle-type-cell"><span title={transfer.vehicle_type || ""}>{transfer.vehicle_type || "Belirtilmedi"}</span></td>
      <td className="transfers-price-cell"><strong>{formatPriceOnly(transfer.price)}</strong></td>
      <td className="transfers-currency-cell"><strong>{formatCurrency(transfer.currency)}</strong></td>
      <td><strong>{getVehiclePlate(transfer)}</strong></td>
      <td><strong>{getDriverName(transfer)}</strong></td>
      <td><span className={`transfers-assignment-state transfers-assignment-${assignmentState.key}`}>{assignmentState.label}</span></td>
      <td><span className={`transfers-status transfers-status-${transfer.status}`}>{getStatusLabel(transfer.status)}</span></td>
    </tr>
  );
}

function matchesColumnFilters(transfer, filters) {
  const direction = getTransferDirection(transfer);
  const assignment = getAssignmentState(transfer);
  const exactChecks = [
    [filters.ref, transfer.booking_reference],
    [filters.supplier, getSupplierLabel(transfer)],
    [filters.date, getDateKey(transfer.pickup_time)],
    [filters.time, formatTime(transfer.pickup_time)],
    [filters.flight, transfer.flight_number || "—"],
    [filters.from, transfer.pickup || "—"],
    [filters.to, transfer.dropoff || "—"],
    [filters.passenger, transfer.passenger_name || "—"],
    [filters.phone, transfer.passenger_phone || "—"],
    [filters.pax, String(getPassengerCount(transfer))],
    [filters.child, String(getChildCount(transfer))],
    [filters.vehicleType, transfer.vehicle_type || "—"],
    [filters.price, formatPriceOnly(transfer.price)],
    [filters.currency, formatCurrency(transfer.currency)],
    [filters.vehicle, getVehiclePlate(transfer)],
    [filters.driver, getDriverName(transfer)],
  ];

  if (exactChecks.some(([selected, actual]) => selected !== "all" && String(actual ?? "") !== String(selected))) return false;
  if (filters.type !== "all" && direction !== filters.type) return false;
  if (filters.assignment !== "all" && assignment.key !== filters.assignment) return false;
  if (filters.status !== "all" && transfer.status !== filters.status) return false;
  return true;
}

function makeOptions(items, getValue, getLabel = (value) => value) {
  const values = [...new Set(items.map(getValue).filter((value) => value !== null && value !== undefined && value !== ""))];
  values.sort((a, b) => String(getLabel(a)).localeCompare(String(getLabel(b)), "tr-TR", { numeric: true }));
  return [["all", "Tümü"], ...values.map((value) => [String(value), String(getLabel(value))])];
}

function normalize(value) {
  return String(value ?? "").trim().toLocaleLowerCase("tr-TR");
}

function getSupplierLabel(transfer) {
  return transfer.supplier_company?.company_name || transfer.supplier || transfer.ota_source || "Atanmadı";
}

function getAssignmentState(transfer) {
  if (!transfer.supplier_id) return { key: "supplier", label: "Tedarikçi bekleniyor" };
  if (!transfer.driver_id || !transfer.assigned_vehicle_id) return { key: "resources", label: "Araç / sürücü bekleniyor" };
  if (transfer.status === "pending") return { key: "driver", label: "Sürücü kabulü bekleniyor" };
  return { key: "ready", label: "Atama tamam" };
}

function getTransferDirection(transfer) {
  const pickupIsAirport = isAirportPoint(transfer.pickup_location, transfer.pickup);
  const dropoffIsAirport = isAirportPoint(transfer.dropoff_location, transfer.dropoff);
  if (pickupIsAirport) return "airport-pickup";
  if (dropoffIsAirport) return "airport-dropoff";
  return "standard";
}

function isAirportPoint(location, address) {
  const searchableText = [
    location?.code,
    location?.name,
    location?.type?.code,
    location?.type?.name,
    location?.type?.slug,
    address,
  ].filter(Boolean).join(" ");
  return /airport|havaliman|aeroport|aéroport|aeropuerto|aeroporto|flughafen|مطار|机场|空港/iu.test(searchableText) || /\([A-Z]{3}\)/u.test(searchableText);
}

function getTransferDirectionLabel(direction) {
  if (direction === "airport-pickup") return "Airport Pickup";
  if (direction === "airport-dropoff") return "Airport Dropoff";
  return "Point to Point";
}

function getPassengerCount(transfer) {
  const values = [transfer.adult, transfer.child, transfer.baby];
  if (values.every((value) => value === null || value === undefined || value === "")) return "—";
  return values.reduce((total, value) => total + Number(value || 0), 0);
}

function getChildCount(transfer) {
  return Number(transfer.child || 0) + Number(transfer.baby || 0);
}

function formatPriceOnly(price) {
  if (price === null || price === undefined || price === "") return "—";
  const numericPrice = Number(price);
  return Number.isNaN(numericPrice) ? "—" : numericPrice.toFixed(2);
}

function formatCurrency(currency) {
  return String(currency || "EUR").trim().toUpperCase();
}

function getVehiclePlate(transfer) {
  if (!transfer.supplier_id) return "—";
  return transfer.assigned_vehicle?.plate || transfer.driver?.vehicle?.plate || transfer.driver?.vehicle_plate || "Tedarikçi atayacak";
}

function getDriverName(transfer) {
  if (!transfer.supplier_id) return "—";
  return transfer.driver?.name || transfer.driver_name || "Tedarikçi atayacak";
}

function canEditTransfer(transfer) {
  return ["pending", "accepted"].includes(transfer?.status);
}

function canCancelTransfer(transfer) {
  return !["completed", "no_show", "cancelled"].includes(transfer?.status);
}

function getDateKey(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTimestamp(value) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
}

function formatDate(value) {
  if (!value) return "Tarih yok";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Tarih yok";
  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(value) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusLabel(status) {
  const labels = {
    pending: "Bekliyor",
    accepted: "Kabul Edildi",
    on_the_way: "Yolda",
    arrived: "Alış Noktasında",
    passenger_called: "Yolcu Arandı",
    passenger_on_board: "Yolcu Araçta",
    trip_started: "Transfer Başladı",
    completed: "Tamamlandı",
    no_show: "No Show",
    cancelled: "İptal",
  };
  return labels[status] || status || "Bilinmiyor";
}

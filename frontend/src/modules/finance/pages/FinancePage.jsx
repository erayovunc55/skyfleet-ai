import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import financeService from "../services/financeService";
import "./finance-page.css";
import "./finance-bulk.css";

const STATUS_OPTIONS = [
  ["", "Tüm durumlar"],
  ["pending", "Bekleyen"],
  ["approved", "Onaylanan"],
  ["paid", "Ödenen"],
  ["disputed", "İtirazlı"],
  ["cancelled", "İptal"],
];

const STATUS_LABELS = {
  pending: "Bekliyor",
  approved: "Onaylandı",
  paid: "Ödendi",
  disputed: "İtirazlı",
  cancelled: "İptal",
};

const EMPTY_FILTERS = {
  search: "",
  status: "",
  date_from: "",
  date_to: "",
};

export default function FinancePage() {
  const [financials, setFinancials] = useState([]);
  const [summary, setSummary] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadFinancials = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await financeService.getFinancials({
        ...cleanFilters(appliedFilters),
        page,
        per_page: 25,
      });

      const items = Array.isArray(response?.data)
        ? response.data
        : [];

      setFinancials(items);
      setSummary(Array.isArray(response?.summary) ? response.summary : []);
      setStatusCounts(response?.status_counts || {});
      setMeta(response?.meta || {});

      setSelected((current) => {
        if (!current) return null;
        return items.find((item) => Number(item.id) === Number(current.id)) || null;
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Finans kayıtları yüklenemedi."));
      setFinancials([]);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    loadFinancials();
  }, [loadFinancials]);

  const totals = useMemo(() => {
    return summary.reduce(
      (result, item) => {
        const currency = item.currency || "EUR";
        result[currency] = item;
        return result;
      },
      {},
    );
  }, [summary]);

  const primarySummary = totals.EUR || summary[0] || {
    currency: "EUR",
    gross_amount: 0,
    supplier_payable: 0,
    platform_margin: 0,
    transfer_count: 0,
  };

  const allVisibleSelected =
    financials.length > 0 &&
    financials.every((item) => selectedIds.includes(Number(item.id)));

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function applyFilters(event) {
    event.preventDefault();
    setPage(1);
    setAppliedFilters(filters);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
    setSelectedIds([]);
  }

  function toggleFinancial(financialId) {
    const id = Number(financialId);
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleAllVisible() {
    const visibleIds = financials.map((item) => Number(item.id));
    setSelectedIds((current) => allVisibleSelected
      ? current.filter((id) => !visibleIds.includes(id))
      : Array.from(new Set([...current, ...visibleIds])));
  }

  async function synchronize() {
    setSyncing(true);
    setError("");
    setMessage("");

    try {
      const response = await financeService.synchronize();
      setMessage(response?.message || "Finans kayıtları eşitlendi.");
      await loadFinancials();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Finans kayıtları eşitlenemedi."));
    } finally {
      setSyncing(false);
    }
  }

  async function approveSelected() {
    if (!selected) return;
    await runAction(
      () => financeService.approve(selected.id),
      "Tedarikçi hakedişi onaylandı.",
    );
  }

  async function markSelectedPaid() {
    if (!selected) return;

    const reference = window.prompt(
      "Banka dekontu veya ödeme referansını girin:",
      selected.payment_reference || "",
    );

    if (!reference?.trim()) return;

    await runAction(
      () => financeService.markPaid(selected.id, {
        payment_reference: reference.trim(),
      }),
      "Hakediş ödenmiş olarak işaretlendi.",
    );
  }

  async function disputeSelected() {
    if (!selected) return;

    const note = window.prompt("İtiraz nedenini yazın:", selected.note || "");
    if (!note?.trim()) return;

    await runAction(
      () => financeService.dispute(selected.id, note.trim()),
      "Finans kaydı itirazlı duruma alındı.",
    );
  }

  async function bulkApproveSelected() {
    if (selectedIds.length === 0) return;
    await runBulkAction(() => financeService.bulkApprove(selectedIds), "Seçilen hakedişler onaylandı.");
  }

  async function bulkPaySelected() {
    if (selectedIds.length === 0) return;
    const reference = window.prompt("Toplu ödeme/dekont referansını girin:", "");
    if (!reference?.trim()) return;
    await runBulkAction(
      () => financeService.bulkMarkPaid(selectedIds, { payment_reference: reference.trim() }),
      "Seçilen hakedişler ödendi olarak işaretlendi.",
    );
  }

  async function runBulkAction(action, successMessage) {
    setActionLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await action();
      setMessage(response?.message || successMessage);
      setSelectedIds([]);
      await loadFinancials();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Toplu finans işlemi tamamlanamadı."));
    } finally {
      setActionLoading(false);
    }
  }

  async function runAction(action, successMessage) {
    setActionLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await action();
      setMessage(response?.message || successMessage);
      await loadFinancials();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Finans işlemi tamamlanamadı."));
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <main className="finance-page">
      <header className="finance-hero">
        <div>
          <span className="finance-eyebrow">FİNANSAL KONTROL</span>
          <h1>Hakediş ve Mutabakat</h1>
          <p>Satışları, tedarikçi ödemelerini ve Skyfleet marjını tek merkezden yönetin.</p>
        </div>

        <button className="finance-sync-button" type="button" disabled={syncing} onClick={synchronize}>
          {syncing ? "Eşitleniyor..." : "Verileri Eşitle"}
        </button>
      </header>

      <section className="finance-summary-grid">
        <SummaryCard label="Brüt Satış" value={money(primarySummary.gross_amount, primarySummary.currency)} tone="blue" />
        <SummaryCard label="Tedarikçi Hakedişi" value={money(primarySummary.supplier_payable, primarySummary.currency)} tone="amber" />
        <SummaryCard label="Skyfleet Marjı" value={money(primarySummary.platform_margin, primarySummary.currency)} tone="green" />
        <SummaryCard label="Finans Kaydı" value={String(meta.total || primarySummary.transfer_count || 0)} detail={`${statusCounts.pending || 0} bekleyen kayıt`} tone="violet" />
      </section>

      {summary.length > 1 && (
        <div className="finance-currency-strip">
          {summary.map((item) => (
            <span key={item.currency}>
              <strong>{item.currency}</strong> · {item.transfer_count} transfer · {money(item.platform_margin, item.currency)} marj
            </span>
          ))}
        </div>
      )}

      <form className="finance-filters" onSubmit={applyFilters}>
        <label>
          <span>Finans kaydı ara</span>
          <input value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="SF numarası, yolcu, tedarikçi..." />
        </label>

        <label>
          <span>Durum</span>
          <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
            {STATUS_OPTIONS.map(([value, label]) => <option key={value || "all"} value={value}>{label}</option>)}
          </select>
        </label>

        <label>
          <span>Başlangıç</span>
          <input type="date" value={filters.date_from} onChange={(event) => updateFilter("date_from", event.target.value)} />
        </label>

        <label>
          <span>Bitiş</span>
          <input type="date" value={filters.date_to} onChange={(event) => updateFilter("date_to", event.target.value)} />
        </label>

        <button type="submit">Filtrele</button>
        <button type="button" className="ghost" onClick={clearFilters}>Temizle</button>
      </form>

      {error && <div className="finance-message error">{error}</div>}
      {message && <div className="finance-message success">{message}</div>}

      <section className={selected ? "finance-workspace has-detail" : "finance-workspace"}>
        <div className="finance-table-card">
          <div className="finance-section-title">
            <div>
              <h2>Transfer Finansları</h2>
              <span>{meta.total || 0} kayıt görüntüleniyor</span>
            </div>
            <div className="finance-bulk-actions">
              <strong>{selectedIds.length} kayıt seçildi</strong>
              <button type="button" disabled={selectedIds.length === 0 || actionLoading} onClick={bulkApproveSelected}>Toplu Onayla</button>
              <button type="button" disabled={selectedIds.length === 0 || actionLoading} onClick={bulkPaySelected}>Toplu Öde</button>
              {selectedIds.length > 0 && <button type="button" className="ghost" onClick={() => setSelectedIds([])}>Seçimi Temizle</button>}
            </div>
          </div>

          <div className="finance-table-wrap">
            <table>
              <thead>
                <tr>
                  <th className="finance-check-column"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Görünen kayıtların tamamını seç" /></th>
                  <th>Rezervasyon</th>
                  <th>Tarih</th>
                  <th>Tedarikçi</th>
                  <th>Satış</th>
                  <th>Hakediş</th>
                  <th>Marj</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {!loading && financials.map((item) => (
                  <tr key={item.id} className={Number(selected?.id) === Number(item.id) ? "active" : ""} onClick={() => setSelected(item)}>
                    <td className="finance-check-column"><input type="checkbox" checked={selectedIds.includes(Number(item.id))} onChange={() => toggleFinancial(item.id)} onClick={(event) => event.stopPropagation()} aria-label={`${item.booking_reference} kaydını seç`} /></td>
                    <td><strong>{item.booking_reference || `#${item.transfer_id}`}</strong><small>{item.passenger_name || "Yolcu belirtilmedi"}</small></td>
                    <td>{dateTime(item.pickup_time)}</td>
                    <td>{item.supplier_name || "Tedarikçi atanmadı"}</td>
                    <td>{money(item.gross_amount, item.currency)}</td>
                    <td>{money(item.supplier_payable, item.currency)}<small>%{Number(item.supplier_percentage || 0).toFixed(0)}</small></td>
                    <td className="margin-cell">{money(item.platform_margin, item.currency)}</td>
                    <td><StatusBadge status={item.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {loading && <div className="finance-state">Finans kayıtları yükleniyor...</div>}
            {!loading && financials.length === 0 && <div className="finance-state">Filtrelere uygun finans kaydı bulunamadı.</div>}
          </div>

          <div className="finance-pagination">
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>← Önceki</button>
            <span>Sayfa {meta.current_page || 1} / {meta.last_page || 1}</span>
            <button type="button" disabled={page >= (meta.last_page || 1) || loading} onClick={() => setPage((current) => current + 1)}>Sonraki →</button>
          </div>
        </div>

        {selected && (
          <aside className="finance-detail">
            <div className="finance-detail-header">
              <div><span>FİNANS DETAYI</span><h2>{selected.booking_reference}</h2></div>
              <button type="button" onClick={() => setSelected(null)}>×</button>
            </div>

            <StatusBadge status={selected.status} />

            <div className="finance-detail-amount">
              <span>Skyfleet Marjı</span>
              <strong>{money(selected.platform_margin, selected.currency)}</strong>
            </div>

            <dl>
              <Detail label="Brüt satış" value={money(selected.gross_amount, selected.currency)} />
              <Detail label="Tedarikçi" value={selected.supplier_name || "Atanmadı"} />
              <Detail label="Ödeme oranı" value={`%${Number(selected.supplier_percentage || 0).toFixed(2)}`} />
              <Detail label="Hakediş" value={money(selected.supplier_payable, selected.currency)} />
              <Detail label="Vade" value={dateTime(selected.due_at)} />
              <Detail label="Ödeme tarihi" value={dateTime(selected.paid_at)} />
              <Detail label="Ödeme referansı" value={selected.payment_reference || "—"} />
              <Detail label="Not" value={selected.note || "—"} />
            </dl>

            <div className="finance-detail-actions">
              {["pending", "disputed"].includes(selected.status) && <button type="button" disabled={actionLoading} onClick={approveSelected}>Hakedişi Onayla</button>}
              {selected.status === "approved" && <button type="button" disabled={actionLoading} onClick={markSelectedPaid}>Ödendi İşaretle</button>}
              {selected.status !== "paid" && selected.status !== "cancelled" && <button className="danger" type="button" disabled={actionLoading} onClick={disputeSelected}>İtirazlı İşaretle</button>}
            </div>
          </aside>
        )}
      </section>
    </main>
  );
}

function SummaryCard({ label, value, detail, tone }) {
  return <article className={`finance-summary-card ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail || "Güncel finans verisi"}</small></article>;
}

function StatusBadge({ status }) {
  return <span className={`finance-status ${status || "pending"}`}>{STATUS_LABELS[status] || status || "Bekliyor"}</span>;
}

function Detail({ label, value }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

function money(value, currency = "EUR") {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: currency || "EUR" }).format(Number(value || 0));
}

function dateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
}

function cleanFilters(filters) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => String(value || "").trim() !== ""));
}

function getErrorMessage(error, fallback) {
  const errors = error?.response?.data?.errors;
  if (errors && typeof errors === "object") {
    const first = Object.values(errors).flat()[0];
    if (first) return first;
  }
  return error?.response?.data?.message || error?.message || fallback;
}

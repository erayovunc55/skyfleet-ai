import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupplierFinancials } from "../services/supplierService";
import "./supplier-finance-page.css";

const STATUS_OPTIONS = [
  ["", "Tüm durumlar"],
  ["pending", "Bekliyor"],
  ["approved", "Onaylandı"],
  ["paid", "Ödendi"],
  ["disputed", "İtirazlı"],
  ["cancelled", "İptal"],
];

export default function SupplierFinancePage() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [filters, setFilters] = useState({ search: "", status: "", dateFrom: "", dateTo: "" });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadFinancials = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getSupplierFinancials({ ...appliedFilters, page, perPage: 25 });
      setRecords(Array.isArray(response?.data) ? response.data : []);
      setSummary(Array.isArray(response?.summary) ? response.summary : []);
      setMeta(response?.meta || { current_page: 1, last_page: 1, total: 0 });
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Hakediş kayıtları yüklenemedi.",
      );
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    loadFinancials();
  }, [loadFinancials]);

  const cards = useMemo(() => {
    const currency = summary[0]?.currency || "EUR";
    const total = (key) => summary.reduce((sum, row) => sum + Number(row?.[key] || 0), 0);
    return [
      ["Toplam Hakediş", total("total_amount"), "total"],
      ["Bekleyen", total("pending_amount"), "pending"],
      ["Onaylanan", total("approved_amount"), "approved"],
      ["Ödenen", total("paid_amount"), "paid"],
    ].map(([label, amount, tone]) => ({ label, amount, tone, currency }));
  }, [summary]);

  function applyFilters(event) {
    event.preventDefault();
    setPage(1);
    setAppliedFilters({ ...filters });
  }

  function clearFilters() {
    const empty = { search: "", status: "", dateFrom: "", dateTo: "" };
    setFilters(empty);
    setAppliedFilters(empty);
    setPage(1);
  }

  return (
    <main className="supplier-finance-page">
      <header className="supplier-finance-hero">
        <div>
          <span className="supplier-finance-eyebrow">FİNANS MERKEZİ</span>
          <h1>Hakedişlerim</h1>
          <p>Onaylanan transferlerinizi, vadelerinizi ve ödeme geçmişinizi izleyin.</p>
        </div>
        <button type="button" onClick={loadFinancials} disabled={loading}>
          {loading ? "Yükleniyor..." : "Verileri Yenile"}
        </button>
      </header>

      <section className="supplier-finance-stats">
        {cards.map((card) => (
          <article key={card.label} className={`supplier-finance-stat ${card.tone}`}>
            <span>{card.label}</span>
            <strong>{formatMoney(card.amount, card.currency)}</strong>
            <small>Güncel finans verisi</small>
          </article>
        ))}
      </section>

      <form className="supplier-finance-filters" onSubmit={applyFilters}>
        <label>
          <span>Hakediş ara</span>
          <input
            value={filters.search}
            placeholder="SF numarası, yolcu veya güzergâh..."
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          />
        </label>
        <label>
          <span>Durum</span>
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          >
            {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>
          <span>Başlangıç</span>
          <input type="date" value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} />
        </label>
        <label>
          <span>Bitiş</span>
          <input type="date" value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} />
        </label>
        <button type="submit">Filtrele</button>
        <button type="button" className="secondary" onClick={clearFilters}>Temizle</button>
      </form>

      {error && <div className="supplier-finance-message error">{error}</div>}

      <section className="supplier-finance-table-card">
        <div className="supplier-finance-table-heading">
          <div><h2>Hakediş Kayıtları</h2><p>{meta.total || 0} kayıt görüntüleniyor</p></div>
        </div>

        {loading ? (
          <div className="supplier-finance-empty">Hakedişler yükleniyor...</div>
        ) : records.length === 0 ? (
          <div className="supplier-finance-empty">Filtrelere uygun hakediş bulunamadı.</div>
        ) : (
          <div className="supplier-finance-table-wrap">
            <table>
              <thead><tr><th>Rezervasyon</th><th>Tarih</th><th>Güzergâh</th><th>Hakediş</th><th>Vade</th><th>Ödeme</th><th>Durum</th></tr></thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td><strong>{record.booking_reference || `#${record.transfer_id}`}</strong><small>{record.passenger_name || "Yolcu belirtilmedi"}</small></td>
                    <td>{formatDateTime(record.pickup_time)}</td>
                    <td className="route"><span>{record.pickup || "—"}</span><b>→</b><span>{record.dropoff || "—"}</span></td>
                    <td className="amount">{formatMoney(record.supplier_amount, record.currency)}</td>
                    <td>{formatDate(record.due_at)}</td>
                    <td><span>{record.paid_at ? formatDate(record.paid_at) : "—"}</span><small>{record.payment_reference || ""}</small></td>
                    <td><span className={`supplier-finance-status ${record.status}`}>{statusLabel(record.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta.last_page > 1 && (
          <div className="supplier-finance-pagination">
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>← Önceki</button>
            <span>Sayfa {meta.current_page} / {meta.last_page}</span>
            <button type="button" disabled={page >= meta.last_page || loading} onClick={() => setPage((value) => value + 1)}>Sonraki →</button>
          </div>
        )}
      </section>
    </main>
  );
}

function formatMoney(value, currency = "EUR") {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: currency || "EUR" }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("tr-TR");
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
}

function statusLabel(status) {
  return { pending: "Bekliyor", approved: "Onaylandı", paid: "Ödendi", disputed: "İtirazlı", cancelled: "İptal" }[status] || status;
}

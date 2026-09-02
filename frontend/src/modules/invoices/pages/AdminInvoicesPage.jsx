import { useCallback, useEffect, useMemo, useState } from "react";
import invoiceService from "../services/invoiceService";
import "./admin-invoices-page.css";

const EMPTY_FILTERS = { search: "", status: "", currency: "", dateFrom: "", dateTo: "" };

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({ total: 0, submitted: 0, approved: 0, revision_requested: 0, rejected: 0, currencies: [] });
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [reviewReason, setReviewReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await invoiceService.getInvoices({ ...appliedFilters, page, perPage: 25 });
      const items = Array.isArray(response?.data) ? response.data : [];
      setInvoices(items);
      setSummary(response?.summary || {});
      setMeta(response?.meta || { current_page: 1, last_page: 1, total: 0 });
      setSelectedInvoice((current) => {
        if (!current) return items[0] || null;
        return items.find((item) => Number(item.id) === Number(current.id)) || items[0] || null;
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Faturalar yüklenemedi."));
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const currencyTotal = useMemo(
    () => summary?.currencies?.[0] || { currency: "EUR", invoice_amount: "0.00" },
    [summary],
  );

  function applyFilters(event) {
    event.preventDefault();
    setPage(1);
    setAppliedFilters({ ...filters });
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
  }

  async function runAction(action) {
    if (!selectedInvoice?.id) return;
    if (["revision", "reject"].includes(action) && reviewReason.trim().length < 10) {
      setError("Düzeltme veya ret açıklaması en az 10 karakter olmalıdır.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      let response;
      if (action === "approve") response = await invoiceService.approve(selectedInvoice.id);
      if (action === "revision") response = await invoiceService.requestRevision(selectedInvoice.id, reviewReason.trim());
      if (action === "reject") response = await invoiceService.reject(selectedInvoice.id, reviewReason.trim());
      setMessage(response?.message || "Fatura durumu güncellendi.");
      setReviewReason("");
      await loadInvoices();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Fatura durumu güncellenemedi."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin-invoices-page">
      <header className="admin-invoices-hero">
        <div><span>BELGE VE MUTABAKAT</span><h1>Fatura Merkezi</h1><p>Tedarikçi faturalarını hakediş kayıtlarıyla birlikte inceleyin.</p></div>
        <button type="button" onClick={loadInvoices} disabled={loading}>{loading ? "Yükleniyor..." : "Verileri Yenile"}</button>
      </header>

      <section className="admin-invoice-stats">
        <Stat label="Toplam Fatura" value={summary.total || 0} tone="total" />
        <Stat label="İncelemede" value={summary.submitted || 0} tone="submitted" />
        <Stat label="Onaylandı" value={summary.approved || 0} tone="approved" />
        <Stat label="Düzeltme" value={summary.revision_requested || 0} tone="revision" />
        <Stat label="Fatura Tutarı" value={formatMoney(currencyTotal.invoice_amount, currencyTotal.currency)} tone="money" />
      </section>

      <form className="admin-invoice-filters" onSubmit={applyFilters}>
        <label><span>Fatura ara</span><input placeholder="Fatura no, tedarikçi veya SF no..." value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} /></label>
        <label><span>Durum</span><select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option value="">Tüm durumlar</option><option value="submitted">İncelemede</option><option value="approved">Onaylandı</option><option value="revision_requested">Düzeltme istendi</option><option value="rejected">Reddedildi</option></select></label>
        <label><span>Başlangıç</span><input type="date" value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} /></label>
        <label><span>Bitiş</span><input type="date" value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} /></label>
        <button type="submit">Filtrele</button><button className="secondary" type="button" onClick={clearFilters}>Temizle</button>
      </form>

      {error && <div className="admin-invoice-message error">{error}</div>}
      {message && <div className="admin-invoice-message success">{message}</div>}

      <section className="admin-invoice-workspace">
        <div className="admin-invoice-list-card">
          <div className="card-heading"><div><h2>Tedarikçi Faturaları</h2><p>{meta.total || 0} kayıt görüntüleniyor</p></div></div>
          {loading ? <div className="invoice-state">Faturalar yükleniyor...</div> : invoices.length === 0 ? <div className="invoice-state">Filtrelere uygun fatura bulunamadı.</div> : (
            <div className="admin-invoice-table-wrap">
              <table><thead><tr><th>Fatura</th><th>Tedarikçi</th><th>Tarih</th><th>Hakediş</th><th>Tutar</th><th>Durum</th></tr></thead>
                <tbody>{invoices.map((invoice) => (
                  <tr key={invoice.id} className={Number(selectedInvoice?.id) === Number(invoice.id) ? "active" : ""} onClick={() => { setSelectedInvoice(invoice); setReviewReason(""); }}>
                    <td><strong>{invoice.invoice_number}</strong><small>{invoice.original_name}</small></td>
                    <td>{invoice.supplier?.company_name || "—"}</td><td>{formatDate(invoice.invoice_date)}</td><td>{invoice.financial_count || 0} kayıt</td><td className="money">{formatMoney(invoice.amount, invoice.currency)}</td><td><Status status={invoice.status} /></td>
                  </tr>
                ))}</tbody></table>
            </div>
          )}
          {meta.last_page > 1 && <div className="invoice-pagination"><button disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>← Önceki</button><span>Sayfa {meta.current_page} / {meta.last_page}</span><button disabled={page >= meta.last_page || loading} onClick={() => setPage((value) => value + 1)}>Sonraki →</button></div>}
        </div>

        {selectedInvoice && (
          <aside className="admin-invoice-detail">
            <div className="detail-heading"><div><span>FATURA DETAYI</span><h2>{selectedInvoice.invoice_number}</h2></div><button type="button" onClick={() => setSelectedInvoice(null)}>×</button></div>
            <Status status={selectedInvoice.status} />
            <div className="detail-amount"><span>Fatura Tutarı</span><strong>{formatMoney(selectedInvoice.amount, selectedInvoice.currency)}</strong></div>
            <div className="detail-rows">
              <Row label="Tedarikçi" value={selectedInvoice.supplier?.company_name} />
              <Row label="Fatura tarihi" value={formatDate(selectedInvoice.invoice_date)} />
              <Row label="Vade" value={formatDate(selectedInvoice.due_date)} />
              <Row label="Dosya" value={selectedInvoice.original_name} />
              <Row label="Hakediş sayısı" value={selectedInvoice.financial_count} />
            </div>
            <button className="download-invoice" type="button" onClick={() => invoiceService.download(selectedInvoice.id, selectedInvoice.original_name)}>Faturayı İndir</button>

            <div className="linked-financials"><h3>Bağlı Hakedişler</h3>{selectedInvoice.financials?.map((financial) => <div key={financial.id}><span><strong>{financial.booking_reference}</strong><small>{financial.passenger_name}</small></span><b>{formatMoney(financial.supplier_amount, financial.currency)}</b></div>)}</div>

            {selectedInvoice.rejection_reason && <div className="existing-review"><strong>İnceleme açıklaması</strong><p>{selectedInvoice.rejection_reason}</p></div>}

            {["submitted", "revision_requested"].includes(selectedInvoice.status) && (
              <div className="invoice-review-actions">
                <label><span>İnceleme açıklaması</span><textarea placeholder="Düzeltme veya ret nedenini yazın..." value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} /></label>
                <button className="approve" disabled={saving} onClick={() => runAction("approve")}>Faturayı Onayla</button>
                <button className="revision" disabled={saving} onClick={() => runAction("revision")}>Düzeltme İste</button>
                <button className="reject" disabled={saving} onClick={() => runAction("reject")}>Faturayı Reddet</button>
              </div>
            )}
          </aside>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value, tone }) { return <article className={`admin-invoice-stat ${tone}`}><span>{label}</span><strong>{value}</strong><small>Güncel belge verisi</small></article>; }
function Row({ label, value }) { return <div><span>{label}</span><strong>{value || "—"}</strong></div>; }
function Status({ status }) { return <span className={`admin-invoice-status ${status}`}>{({ submitted: "İncelemede", approved: "Onaylandı", revision_requested: "Düzeltme İstendi", rejected: "Reddedildi" })[status] || status}</span>; }
function formatMoney(value, currency = "EUR") { return new Intl.NumberFormat("tr-TR", { style: "currency", currency: currency || "EUR" }).format(Number(value || 0)); }
function formatDate(value) { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("tr-TR"); }
function getErrorMessage(error, fallback) { const errors = error?.response?.data?.errors; return (errors ? Object.values(errors).flat().find(Boolean) : null) || error?.response?.data?.message || error?.message || fallback; }

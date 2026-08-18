import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createSupplierInvoice,
  downloadSupplierInvoice,
  getSupplierFinancials,
  getSupplierInvoices,
} from "../services/supplierService";
import "./supplier-invoices-page.css";

const initialForm = {
  invoiceNumber: "",
  invoiceDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  currency: "EUR",
  note: "",
  file: null,
};

export default function SupplierInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [approvedFinancials, setApprovedFinancials] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [invoiceResponse, financialResponse] = await Promise.all([
        getSupplierInvoices({ perPage: 100 }),
        getSupplierFinancials({ status: "approved", perPage: 100 }),
      ]);
      setInvoices(Array.isArray(invoiceResponse?.data) ? invoiceResponse.data : []);
      setApprovedFinancials(
        Array.isArray(financialResponse?.data) ? financialResponse.data : [],
      );
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || "Fatura bilgileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const selectedFinancials = useMemo(
    () => approvedFinancials.filter((item) => selectedIds.includes(Number(item.id))),
    [approvedFinancials, selectedIds],
  );

  const selectedTotal = useMemo(
    () => selectedFinancials.reduce((sum, item) => sum + Number(item.supplier_amount || 0), 0),
    [selectedFinancials],
  );

  function toggleFinancial(id) {
    const numericId = Number(id);
    setSelectedIds((current) =>
      current.includes(numericId)
        ? current.filter((item) => item !== numericId)
        : [...current, numericId],
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (selectedIds.length === 0) {
      setError("Faturaya eklenecek en az bir onaylı hakediş seçmelisiniz.");
      return;
    }
    if (!form.file) {
      setError("PDF, JPG veya PNG fatura dosyasını seçmelisiniz.");
      return;
    }

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("invoice_number", form.invoiceNumber.trim());
      payload.append("invoice_date", form.invoiceDate);
      if (form.dueDate) payload.append("due_date", form.dueDate);
      payload.append("amount", selectedTotal.toFixed(2));
      payload.append("currency", form.currency);
      payload.append("file", form.file);
      if (form.note.trim()) payload.append("note", form.note.trim());
      selectedIds.forEach((id) => payload.append("financial_ids[]", String(id)));

      const response = await createSupplierInvoice(payload);
      setMessage(response?.message || "Fatura başarıyla gönderildi.");
      setForm({ ...initialForm, invoiceDate: new Date().toISOString().slice(0, 10) });
      setSelectedIds([]);
      await loadPage();
    } catch (requestError) {
      const errors = requestError?.response?.data?.errors;
      const firstValidationError = errors
        ? Object.values(errors).flat().find(Boolean)
        : null;
      setError(firstValidationError || requestError?.response?.data?.message || requestError?.message || "Fatura gönderilemedi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="supplier-invoices-page">
      <header className="supplier-invoices-hero">
        <div>
          <span>FİNANS BELGELERİ</span>
          <h1>Faturalar</h1>
          <p>Onaylanan hakedişlerinizi seçin, faturanızı güvenli biçimde gönderin.</p>
        </div>
        <button type="button" onClick={loadPage} disabled={loading}>Verileri Yenile</button>
      </header>

      {error && <div className="supplier-invoice-message error">{error}</div>}
      {message && <div className="supplier-invoice-message success">{message}</div>}

      <section className="supplier-invoice-grid">
        <form className="supplier-invoice-form" onSubmit={handleSubmit}>
          <div className="section-title">
            <span>YENİ FATURA</span>
            <h2>Hakediş Seçimi</h2>
            <p>Yalnızca yönetici tarafından onaylanan ve henüz faturalanmayan kayıtlar listelenir.</p>
          </div>

          <div className="approved-financial-list">
            {loading ? (
              <div className="invoice-empty">Hakedişler yükleniyor...</div>
            ) : approvedFinancials.length === 0 ? (
              <div className="invoice-empty">Faturalanmaya hazır onaylı hakediş bulunmuyor.</div>
            ) : approvedFinancials.map((financial) => (
              <label className="approved-financial-row" key={financial.id}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(Number(financial.id))}
                  onChange={() => toggleFinancial(financial.id)}
                />
                <div>
                  <strong>{financial.booking_reference}</strong>
                  <small>{financial.passenger_name || "Yolcu belirtilmedi"}</small>
                </div>
                <span>{formatDate(financial.pickup_time)}</span>
                <b>{formatMoney(financial.supplier_amount, financial.currency)}</b>
              </label>
            ))}
          </div>

          <div className="invoice-selected-total">
            <span>{selectedIds.length} hakediş seçildi</span>
            <strong>{formatMoney(selectedTotal, form.currency)}</strong>
          </div>

          <div className="invoice-form-fields">
            <label><span>Fatura Numarası *</span><input required maxLength="100" value={form.invoiceNumber} onChange={(event) => setForm((current) => ({ ...current, invoiceNumber: event.target.value }))} /></label>
            <label><span>Fatura Tarihi *</span><input required type="date" value={form.invoiceDate} onChange={(event) => setForm((current) => ({ ...current, invoiceDate: event.target.value }))} /></label>
            <label><span>Vade Tarihi</span><input type="date" min={form.invoiceDate} value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} /></label>
            <label><span>Para Birimi *</span><select value={form.currency} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))}><option value="EUR">EUR — Euro</option><option value="USD">USD — Dolar</option><option value="TRY">TRY — Türk Lirası</option><option value="GBP">GBP — Sterlin</option></select></label>
            <label className="wide"><span>Fatura Dosyası * (PDF/JPG/PNG, en fazla 10 MB)</span><input required type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => setForm((current) => ({ ...current, file: event.target.files?.[0] || null }))} /></label>
            <label className="wide"><span>Tedarikçi Notu</span><textarea maxLength="2000" value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} /></label>
          </div>

          <button className="submit-invoice" type="submit" disabled={saving || selectedIds.length === 0}>
            {saving ? "Fatura Gönderiliyor..." : "Faturayı Gönder"}
          </button>
        </form>

        <section className="supplier-invoice-history">
          <div className="section-title"><span>FATURA GEÇMİŞİ</span><h2>Gönderilen Faturalar</h2><p>{invoices.length} kayıt görüntüleniyor</p></div>
          {loading ? <div className="invoice-empty">Faturalar yükleniyor...</div> : invoices.length === 0 ? <div className="invoice-empty">Henüz gönderilmiş fatura yok.</div> : (
            <div className="invoice-history-list">
              {invoices.map((invoice) => (
                <article key={invoice.id}>
                  <div className="invoice-history-head">
                    <div><strong>{invoice.invoice_number}</strong><small>{formatDate(invoice.invoice_date)}</small></div>
                    <span className={`invoice-status ${invoice.status}`}>{statusLabel(invoice.status)}</span>
                  </div>
                  <div className="invoice-history-details">
                    <span>Hakediş <b>{formatMoney(invoice.amount, invoice.currency)}</b></span>
                    <span>Kayıt <b>{invoice.financial_count || 0}</b></span>
                    <span>Dosya <b>{invoice.original_name}</b></span>
                  </div>
                  {invoice.rejection_reason && <p className="invoice-review-note">{invoice.rejection_reason}</p>}
                  <button type="button" onClick={() => downloadSupplierInvoice(invoice.id, invoice.original_name)}>Faturayı İndir</button>
                </article>
              ))}
            </div>
          )}
        </section>
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

function statusLabel(status) {
  return { submitted: "İncelemede", approved: "Onaylandı", revision_requested: "Düzeltme İstendi", rejected: "Reddedildi" }[status] || status;
}

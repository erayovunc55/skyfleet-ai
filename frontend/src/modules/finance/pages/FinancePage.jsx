import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import financeService from "../services/financeService";
import "./finance-page.css";
import "./finance-bulk.css";

const COPY = {
  tr: {
    statusOptions: [["", "Tüm durumlar"], ["pending", "Bekleyen"], ["approved", "Onaylanan"], ["paid", "Ödenen"], ["disputed", "İtirazlı"], ["cancelled", "İptal"]],
    statusLabels: { pending: "Bekliyor", approved: "Onaylandı", paid: "Ödendi", disputed: "İtirazlı", cancelled: "İptal" },
    loadError: "Finans kayıtları yüklenemedi.", synced: "Finans kayıtları eşitlendi.", syncError: "Finans kayıtları eşitlenemedi.",
    approvedMessage: "Tedarikçi hakedişi onaylandı.", paymentPrompt: "Banka dekontu veya ödeme referansını girin:",
    paidMessage: "Hakediş ödenmiş olarak işaretlendi.", disputePrompt: "İtiraz nedenini yazın:",
    disputedMessage: "Finans kaydı itirazlı duruma alındı.", bulkApproved: "Seçilen hakedişler onaylandı.",
    bulkPaymentPrompt: "Toplu ödeme/dekont referansını girin:", bulkPaid: "Seçilen hakedişler ödendi olarak işaretlendi.",
    bulkError: "Toplu finans işlemi tamamlanamadı.", actionError: "Finans işlemi tamamlanamadı.",
    eyebrow: "FİNANSAL KONTROL", title: "Hakediş ve Mutabakat", subtitle: "Satışları, tedarikçi ödemelerini ve Skyfleet marjını tek merkezden yönetin.",
    syncing: "Eşitleniyor...", sync: "Verileri Eşitle", grossSales: "Brüt Satış", supplierPayable: "Tedarikçi Hakedişi",
    skyfleetMargin: "Skyfleet Marjı", financeRecords: "Finans Kaydı", pendingRecords: n => `${n} bekleyen kayıt`,
    currentFinance: "Güncel finans verisi", transferMargin: (n, m) => `${n} transfer · ${m} marj`,
    search: "Finans kaydı ara", searchPlaceholder: "SF numarası, yolcu, tedarikçi...", status: "Durum",
    start: "Başlangıç", end: "Bitiş", filter: "Filtrele", clear: "Temizle", transferFinances: "Transfer Finansları",
    recordsShown: n => `${n} kayıt görüntüleniyor`, recordsSelected: n => `${n} kayıt seçildi`, bulkApprove: "Toplu Onayla",
    bulkPay: "Toplu Öde", clearSelection: "Seçimi Temizle", selectAll: "Görünen kayıtların tamamını seç",
    reservation: "Rezervasyon", date: "Tarih", supplier: "Tedarikçi", sales: "Satış", payable: "Hakediş", margin: "Marj",
    selectRecord: ref => `${ref} kaydını seç`, passengerUnknown: "Yolcu belirtilmedi", supplierUnassigned: "Tedarikçi atanmadı",
    loading: "Finans kayıtları yükleniyor...", noRecords: "Filtrelere uygun finans kaydı bulunamadı.",
    previous: "← Önceki", page: (a,b) => `Sayfa ${a} / ${b}`, next: "Sonraki →", detail: "FİNANS DETAYI",
    grossSale: "Brüt satış", unassigned: "Atanmadı", paymentRate: "Ödeme oranı", due: "Vade", paymentDate: "Ödeme tarihi",
    paymentReference: "Ödeme referansı", note: "Not", approvePayable: "Hakedişi Onayla", markPaid: "Ödendi İşaretle",
    markDisputed: "İtirazlı İşaretle",
  },
  en: {
    statusOptions: [["", "All statuses"], ["pending", "Pending"], ["approved", "Approved"], ["paid", "Paid"], ["disputed", "Disputed"], ["cancelled", "Cancelled"]],
    statusLabels: { pending: "Pending", approved: "Approved", paid: "Paid", disputed: "Disputed", cancelled: "Cancelled" },
    loadError: "Finance records could not be loaded.", synced: "Finance records synchronized.", syncError: "Finance records could not be synchronized.",
    approvedMessage: "Supplier payable approved.", paymentPrompt: "Enter the bank receipt or payment reference:",
    paidMessage: "Payable marked as paid.", disputePrompt: "Enter the dispute reason:",
    disputedMessage: "Finance record marked as disputed.", bulkApproved: "Selected payables approved.",
    bulkPaymentPrompt: "Enter the bulk payment/receipt reference:", bulkPaid: "Selected payables marked as paid.",
    bulkError: "Bulk finance operation could not be completed.", actionError: "Finance operation could not be completed.",
    eyebrow: "FINANCIAL CONTROL", title: "Payables & Reconciliation", subtitle: "Manage sales, supplier payments and Skyfleet margin from one center.",
    syncing: "Synchronizing...", sync: "Synchronize Data", grossSales: "Gross Sales", supplierPayable: "Supplier Payable",
    skyfleetMargin: "Skyfleet Margin", financeRecords: "Finance Records", pendingRecords: n => `${n} pending records`,
    currentFinance: "Current finance data", transferMargin: (n, m) => `${n} transfers · ${m} margin`,
    search: "Search finance records", searchPlaceholder: "SF number, passenger, supplier...", status: "Status",
    start: "Start", end: "End", filter: "Filter", clear: "Clear", transferFinances: "Transfer Finances",
    recordsShown: n => `${n} records displayed`, recordsSelected: n => `${n} records selected`, bulkApprove: "Bulk Approve",
    bulkPay: "Bulk Pay", clearSelection: "Clear Selection", selectAll: "Select all visible records",
    reservation: "Reservation", date: "Date", supplier: "Supplier", sales: "Sales", payable: "Payable", margin: "Margin",
    selectRecord: ref => `Select ${ref}`, passengerUnknown: "Passenger not specified", supplierUnassigned: "Supplier not assigned",
    loading: "Loading finance records...", noRecords: "No finance records match the filters.",
    previous: "← Previous", page: (a,b) => `Page ${a} / ${b}`, next: "Next →", detail: "FINANCE DETAILS",
    grossSale: "Gross sale", unassigned: "Not assigned", paymentRate: "Payment rate", due: "Due date", paymentDate: "Payment date",
    paymentReference: "Payment reference", note: "Note", approvePayable: "Approve Payable", markPaid: "Mark as Paid",
    markDisputed: "Mark as Disputed",
  },
  es: {
    statusOptions: [["", "Todos los estados"], ["pending", "Pendiente"], ["approved", "Aprobado"], ["paid", "Pagado"], ["disputed", "En disputa"], ["cancelled", "Cancelado"]],
    statusLabels: { pending: "Pendiente", approved: "Aprobado", paid: "Pagado", disputed: "En disputa", cancelled: "Cancelado" },
    loadError: "No se pudieron cargar los registros financieros.", synced: "Registros financieros sincronizados.", syncError: "No se pudieron sincronizar los registros financieros.",
    approvedMessage: "Pago del proveedor aprobado.", paymentPrompt: "Introduzca el recibo bancario o la referencia de pago:",
    paidMessage: "Pago marcado como pagado.", disputePrompt: "Introduzca el motivo de la disputa:",
    disputedMessage: "Registro financiero marcado como disputado.", bulkApproved: "Pagos seleccionados aprobados.",
    bulkPaymentPrompt: "Introduzca la referencia del pago/recibo colectivo:", bulkPaid: "Pagos seleccionados marcados como pagados.",
    bulkError: "No se pudo completar la operación financiera colectiva.", actionError: "No se pudo completar la operación financiera.",
    eyebrow: "CONTROL FINANCIERO", title: "Pagos y Conciliación", subtitle: "Gestione ventas, pagos a proveedores y margen de Skyfleet desde un solo centro.",
    syncing: "Sincronizando...", sync: "Sincronizar Datos", grossSales: "Ventas Brutas", supplierPayable: "Pago al Proveedor",
    skyfleetMargin: "Margen Skyfleet", financeRecords: "Registros Financieros", pendingRecords: n => `${n} registros pendientes`,
    currentFinance: "Datos financieros actuales", transferMargin: (n, m) => `${n} transferencias · ${m} margen`,
    search: "Buscar registro financiero", searchPlaceholder: "Número SF, pasajero, proveedor...", status: "Estado",
    start: "Inicio", end: "Fin", filter: "Filtrar", clear: "Limpiar", transferFinances: "Finanzas de Traslados",
    recordsShown: n => `${n} registros mostrados`, recordsSelected: n => `${n} registros seleccionados`, bulkApprove: "Aprobar Selección",
    bulkPay: "Pagar Selección", clearSelection: "Limpiar Selección", selectAll: "Seleccionar todos los registros visibles",
    reservation: "Reserva", date: "Fecha", supplier: "Proveedor", sales: "Venta", payable: "Pago", margin: "Margen",
    selectRecord: ref => `Seleccionar ${ref}`, passengerUnknown: "Pasajero no especificado", supplierUnassigned: "Proveedor no asignado",
    loading: "Cargando registros financieros...", noRecords: "No hay registros financieros que coincidan con los filtros.",
    previous: "← Anterior", page: (a,b) => `Página ${a} / ${b}`, next: "Siguiente →", detail: "DETALLES FINANCIEROS",
    grossSale: "Venta bruta", unassigned: "No asignado", paymentRate: "Tasa de pago", due: "Vencimiento", paymentDate: "Fecha de pago",
    paymentReference: "Referencia de pago", note: "Nota", approvePayable: "Aprobar Pago", markPaid: "Marcar Pagado",
    markDisputed: "Marcar en Disputa",
  },
  ar: {
    statusOptions: [["", "جميع الحالات"], ["pending", "قيد الانتظار"], ["approved", "معتمد"], ["paid", "مدفوع"], ["disputed", "متنازع عليه"], ["cancelled", "ملغى"]],
    statusLabels: { pending: "قيد الانتظار", approved: "معتمد", paid: "مدفوع", disputed: "متنازع عليه", cancelled: "ملغى" },
    loadError: "تعذر تحميل السجلات المالية.", synced: "تمت مزامنة السجلات المالية.", syncError: "تعذرت مزامنة السجلات المالية.",
    approvedMessage: "تم اعتماد مستحق المورد.", paymentPrompt: "أدخل إيصال البنك أو مرجع الدفع:",
    paidMessage: "تم وضع علامة مدفوع على المستحق.", disputePrompt: "أدخل سبب الاعتراض:",
    disputedMessage: "تم وضع السجل المالي في حالة اعتراض.", bulkApproved: "تم اعتماد المستحقات المحددة.",
    bulkPaymentPrompt: "أدخل مرجع الدفع/الإيصال الجماعي:", bulkPaid: "تم وضع علامة مدفوع على المستحقات المحددة.",
    bulkError: "تعذر إكمال العملية المالية الجماعية.", actionError: "تعذر إكمال العملية المالية.",
    eyebrow: "الرقابة المالية", title: "المستحقات والتسوية", subtitle: "إدارة المبيعات ومدفوعات الموردين وهامش Skyfleet من مركز واحد.",
    syncing: "جارٍ المزامنة...", sync: "مزامنة البيانات", grossSales: "إجمالي المبيعات", supplierPayable: "مستحق المورد",
    skyfleetMargin: "هامش Skyfleet", financeRecords: "السجلات المالية", pendingRecords: n => `${n} سجلات معلقة`,
    currentFinance: "البيانات المالية الحالية", transferMargin: (n, m) => `${n} تحويلات · ${m} هامش`,
    search: "البحث في السجلات المالية", searchPlaceholder: "رقم SF، الراكب، المورد...", status: "الحالة",
    start: "البداية", end: "النهاية", filter: "تصفية", clear: "مسح", transferFinances: "مالية التحويلات",
    recordsShown: n => `يتم عرض ${n} سجلات`, recordsSelected: n => `تم تحديد ${n} سجلات`, bulkApprove: "اعتماد جماعي",
    bulkPay: "دفع جماعي", clearSelection: "مسح التحديد", selectAll: "تحديد جميع السجلات الظاهرة",
    reservation: "الحجز", date: "التاريخ", supplier: "المورد", sales: "المبيعات", payable: "المستحق", margin: "الهامش",
    selectRecord: ref => `تحديد ${ref}`, passengerUnknown: "الراكب غير محدد", supplierUnassigned: "لم يتم تعيين مورد",
    loading: "جارٍ تحميل السجلات المالية...", noRecords: "لا توجد سجلات مالية مطابقة لعوامل التصفية.",
    previous: "السابق ←", page: (a,b) => `الصفحة ${a} / ${b}`, next: "→ التالي", detail: "التفاصيل المالية",
    grossSale: "إجمالي البيع", unassigned: "غير معين", paymentRate: "نسبة الدفع", due: "الاستحقاق", paymentDate: "تاريخ الدفع",
    paymentReference: "مرجع الدفع", note: "ملاحظة", approvePayable: "اعتماد المستحق", markPaid: "تحديد كمدفوع",
    markDisputed: "تحديد كمتنازع عليه",
  },
};

function normalizeLanguage(value) {
  const language = String(value || "tr").toLowerCase();
  if (language.startsWith("en")) return "en";
  if (language.startsWith("es")) return "es";
  if (language.startsWith("ar")) return "ar";
  return "tr";
}

function getStoredLanguage() {
  try { return normalizeLanguage(localStorage.getItem("skyfleet_language")); }
  catch { return "tr"; }
}

function localeFor(language) {
  return ({ tr: "tr-TR", en: "en-GB", es: "es-ES", ar: "ar-SA" })[language] || "tr-TR";
}

const EMPTY_FILTERS = {
  search: "",
  status: "",
  date_from: "",
  date_to: "",
};

export default function FinancePage() {
  const [language, setLanguage] = useState(getStoredLanguage);
  const t = COPY[language] || COPY.tr;
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

  useEffect(() => {
    const syncLanguage = () => setLanguage(getStoredLanguage());
    window.addEventListener("storage", syncLanguage);
    window.addEventListener("skyfleet-language-change", syncLanguage);
    const timer = window.setInterval(syncLanguage, 300);
    return () => {
      window.removeEventListener("storage", syncLanguage);
      window.removeEventListener("skyfleet-language-change", syncLanguage);
      window.clearInterval(timer);
    };
  }, []);

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
      setError(getErrorMessage(requestError, t.loadError));
      setFinancials([]);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, t.loadError]);

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
      setMessage(response?.message || t.synced);
      await loadFinancials();
    } catch (requestError) {
      setError(getErrorMessage(requestError, t.syncError));
    } finally {
      setSyncing(false);
    }
  }

  async function approveSelected() {
    if (!selected) return;
    await runAction(
      () => financeService.approve(selected.id),
      t.approvedMessage,
    );
  }

  async function markSelectedPaid() {
    if (!selected) return;

    const reference = window.prompt(
      t.paymentPrompt,
      selected.payment_reference || "",
    );

    if (!reference?.trim()) return;

    await runAction(
      () => financeService.markPaid(selected.id, {
        payment_reference: reference.trim(),
      }),
      t.paidMessage,
    );
  }

  async function disputeSelected() {
    if (!selected) return;

    const note = window.prompt(t.disputePrompt, selected.note || "");
    if (!note?.trim()) return;

    await runAction(
      () => financeService.dispute(selected.id, note.trim()),
      t.disputedMessage,
    );
  }

  async function bulkApproveSelected() {
    if (selectedIds.length === 0) return;
    await runBulkAction(() => financeService.bulkApprove(selectedIds), t.bulkApproved);
  }

  async function bulkPaySelected() {
    if (selectedIds.length === 0) return;
    const reference = window.prompt(t.bulkPaymentPrompt, "");
    if (!reference?.trim()) return;
    await runBulkAction(
      () => financeService.bulkMarkPaid(selectedIds, { payment_reference: reference.trim() }),
      t.bulkPaid,
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
      setError(getErrorMessage(requestError, t.bulkError));
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
      setError(getErrorMessage(requestError, t.actionError));
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <main className="finance-page" dir={language === "ar" ? "rtl" : "ltr"}>
      <header className="finance-hero">
        <div>
          <span className="finance-eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>

        <button className="finance-sync-button" type="button" disabled={syncing} onClick={synchronize}>
          {syncing ? t.syncing : t.sync}
        </button>
      </header>

      <section className="finance-summary-grid">
        <SummaryCard label={t.grossSales} value={money(primarySummary.gross_amount, primarySummary.currency, language)} tone="blue" detail={t.currentFinance} />
        <SummaryCard label={t.supplierPayable} value={money(primarySummary.supplier_payable, primarySummary.currency, language)} tone="amber" detail={t.currentFinance} />
        <SummaryCard label={t.skyfleetMargin} value={money(primarySummary.platform_margin, primarySummary.currency, language)} tone="green" detail={t.currentFinance} />
        <SummaryCard label={t.financeRecords} value={String(meta.total || primarySummary.transfer_count || 0)} detail={t.pendingRecords(statusCounts.pending || 0)} tone="violet" />
      </section>

      {summary.length > 1 && (
        <div className="finance-currency-strip">
          {summary.map((item) => (
            <span key={item.currency}>
              <strong>{item.currency}</strong> · {t.transferMargin(item.transfer_count, money(item.platform_margin, item.currency, language))}
            </span>
          ))}
        </div>
      )}

      <form className="finance-filters" onSubmit={applyFilters}>
        <label>
          <span>{t.search}</span>
          <input value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} placeholder={t.searchPlaceholder} />
        </label>

        <label>
          <span>{t.status}</span>
          <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
            {t.statusOptions.map(([value, label]) => <option key={value || "all"} value={value}>{label}</option>)}
          </select>
        </label>

        <label>
          <span>{t.start}</span>
          <input type="date" value={filters.date_from} onChange={(event) => updateFilter("date_from", event.target.value)} />
        </label>

        <label>
          <span>{t.end}</span>
          <input type="date" value={filters.date_to} onChange={(event) => updateFilter("date_to", event.target.value)} />
        </label>

        <button type="submit">{t.filter}</button>
        <button type="button" className="ghost" onClick={clearFilters}>{t.clear}</button>
      </form>

      {error && <div className="finance-message error">{error}</div>}
      {message && <div className="finance-message success">{message}</div>}

      <section className={selected ? "finance-workspace has-detail" : "finance-workspace"}>
        <div className="finance-table-card">
          <div className="finance-section-title">
            <div>
              <h2>{t.transferFinances}</h2>
              <span>{t.recordsShown(meta.total || 0)}</span>
            </div>
            <div className="finance-bulk-actions">
              <strong>{t.recordsSelected(selectedIds.length)}</strong>
              <button type="button" disabled={selectedIds.length === 0 || actionLoading} onClick={bulkApproveSelected}>{t.bulkApprove}</button>
              <button type="button" disabled={selectedIds.length === 0 || actionLoading} onClick={bulkPaySelected}>{t.bulkPay}</button>
              {selectedIds.length > 0 && <button type="button" className="ghost" onClick={() => setSelectedIds([])}>{t.clearSelection}</button>}
            </div>
          </div>

          <div className="finance-table-wrap">
            <table>
              <thead>
                <tr>
                  <th className="finance-check-column"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label={t.selectAll} /></th>
                  <th>{t.reservation}</th>
                  <th>{t.date}</th>
                  <th>{t.supplier}</th>
                  <th>{t.sales}</th>
                  <th>{t.payable}</th>
                  <th>{t.margin}</th>
                  <th>{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {!loading && financials.map((item) => (
                  <tr key={item.id} className={Number(selected?.id) === Number(item.id) ? "active" : ""} onClick={() => setSelected(item)}>
                    <td className="finance-check-column"><input type="checkbox" checked={selectedIds.includes(Number(item.id))} onChange={() => toggleFinancial(item.id)} onClick={(event) => event.stopPropagation()} aria-label={t.selectRecord(item.booking_reference)} /></td>
                    <td><strong>{item.booking_reference || `#${item.transfer_id}`}</strong><small>{item.passenger_name || t.passengerUnknown}</small></td>
                    <td>{dateTime(item.pickup_time, language)}</td>
                    <td>{item.supplier_name || t.supplierUnassigned}</td>
                    <td>{money(item.gross_amount, item.currency, language)}</td>
                    <td>{money(item.supplier_payable, item.currency, language)}<small>%{Number(item.supplier_percentage || 0).toFixed(0)}</small></td>
                    <td className="margin-cell">{money(item.platform_margin, item.currency, language)}</td>
                    <td><StatusBadge status={item.status} labels={t.statusLabels} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {loading && <div className="finance-state">{t.loading}</div>}
            {!loading && financials.length === 0 && <div className="finance-state">{t.noRecords}</div>}
          </div>

          <div className="finance-pagination">
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>{t.previous}</button>
            <span>{t.page(meta.current_page || 1, meta.last_page || 1)}</span>
            <button type="button" disabled={page >= (meta.last_page || 1) || loading} onClick={() => setPage((current) => current + 1)}>{t.next}</button>
          </div>
        </div>

        {selected && (
          <aside className="finance-detail">
            <div className="finance-detail-header">
              <div><span>{t.detail}</span><h2>{selected.booking_reference}</h2></div>
              <button type="button" onClick={() => setSelected(null)}>×</button>
            </div>

            <StatusBadge status={selected.status} labels={t.statusLabels} />

            <div className="finance-detail-amount">
              <span>{t.skyfleetMargin}</span>
              <strong>{money(selected.platform_margin, selected.currency, language)}</strong>
            </div>

            <dl>
              <Detail label={t.grossSale} value={money(selected.gross_amount, selected.currency, language)} />
              <Detail label={t.supplier} value={selected.supplier_name || t.unassigned} />
              <Detail label={t.paymentRate} value={`%${Number(selected.supplier_percentage || 0).toFixed(2)}`} />
              <Detail label={t.payable} value={money(selected.supplier_payable, selected.currency, language)} />
              <Detail label={t.due} value={dateTime(selected.due_at, language)} />
              <Detail label={t.paymentDate} value={dateTime(selected.paid_at, language)} />
              <Detail label={t.paymentReference} value={selected.payment_reference || "—"} />
              <Detail label={t.note} value={selected.note || "—"} />
            </dl>

            <div className="finance-detail-actions">
              {["pending", "disputed"].includes(selected.status) && <button type="button" disabled={actionLoading} onClick={approveSelected}>{t.approvePayable}</button>}
              {selected.status === "approved" && <button type="button" disabled={actionLoading} onClick={markSelectedPaid}>{t.markPaid}</button>}
              {selected.status !== "paid" && selected.status !== "cancelled" && <button className="danger" type="button" disabled={actionLoading} onClick={disputeSelected}>{t.markDisputed}</button>}
            </div>
          </aside>
        )}
      </section>
    </main>
  );
}

function SummaryCard({ label, value, detail, tone }) {
  return <article className={`finance-summary-card ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail || "—"}</small></article>;
}

function StatusBadge({ status, labels }) {
  return <span className={`finance-status ${status || "pending"}`}>{labels?.[status] || status || labels?.pending || "—"}</span>;
}

function Detail({ label, value }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

function money(value, currency = "EUR", language = "tr") {
  return new Intl.NumberFormat(localeFor(language), { style: "currency", currency: currency || "EUR" }).format(Number(value || 0));
}

function dateTime(value, language = "tr") {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(localeFor(language), { dateStyle: "medium", timeStyle: "short" });
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

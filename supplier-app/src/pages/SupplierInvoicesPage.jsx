import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useLanguage } from "../i18n";

import {
  createSupplierInvoice,
  downloadSupplierInvoice,
  getSupplierFinancials,
  getSupplierInvoices,
} from "../services/supplierService";

import "./supplier-invoices-page.css";

const createInitialForm = () => ({
  invoiceNumber: "",
  invoiceDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  currency: "EUR",
  note: "",
  file: null,
});

const TEXT = {
  tr: {
    loadError: "Fatura bilgileri yüklenemedi.",
    selectEarningError:
      "Faturaya eklenecek en az bir onaylı hakediş seçmelisiniz.",
    selectFileError:
      "PDF, JPG veya PNG fatura dosyasını seçmelisiniz.",
    submitSuccess: "Fatura başarıyla gönderildi.",
    submitError: "Fatura gönderilemedi.",
    eyebrow: "FİNANS BELGELERİ",
    title: "Faturalar",
    description:
      "Onaylanan hakedişlerinizi seçin, faturanızı güvenli biçimde gönderin.",
    loading: "Yükleniyor...",
    refreshData: "Verileri Yenile",
    newInvoice: "YENİ FATURA",
    earningsSelection: "Hakediş Seçimi",
    earningsDescription:
      "Yalnızca yönetici tarafından onaylanan ve henüz faturalanmayan kayıtlar listelenir.",
    loadingEarnings: "Hakedişler yükleniyor...",
    noApprovedEarnings:
      "Faturalanmaya hazır onaylı hakediş bulunmuyor.",
    passengerNotSpecified: "Yolcu belirtilmedi",
    selectedEarningsSuffix: "hakediş seçildi",
    invoiceNumber: "Fatura Numarası *",
    invoiceDate: "Fatura Tarihi *",
    dueDate: "Vade Tarihi",
    currency: "Para Birimi *",
    invoiceFile:
      "Fatura Dosyası * (PDF/JPG/PNG, en fazla 10 MB)",
    supplierNote: "Tedarikçi Notu",
    chooseFile: "Dosya Seç",
    noFileSelected: "Dosya seçilmedi",
    changeFile: "Dosyayı Değiştir",
    euro: "Euro",
    dollar: "Dolar",
    turkishLira: "Türk Lirası",
    pound: "Sterlin",
    submitting: "Fatura Gönderiliyor...",
    submitInvoice: "Faturayı Gönder",
    invoiceHistory: "FATURA GEÇMİŞİ",
    submittedInvoices: "Gönderilen Faturalar",
    recordsDisplayed: "kayıt görüntüleniyor",
    loadingInvoices: "Faturalar yükleniyor...",
    noInvoices: "Henüz gönderilmiş fatura yok.",
    earnings: "Hakediş",
    records: "Kayıt",
    file: "Dosya",
    downloadInvoice: "Faturayı İndir",
    submittedStatus: "İncelemede",
    approvedStatus: "Onaylandı",
    revisionRequestedStatus: "Düzeltme İstendi",
    rejectedStatus: "Reddedildi",
  },

  en: {
    loadError: "Invoice information could not be loaded.",
    selectEarningError:
      "Select at least one approved earning to include in the invoice.",
    selectFileError:
      "Select a PDF, JPG or PNG invoice file.",
    submitSuccess: "Invoice submitted successfully.",
    submitError: "The invoice could not be submitted.",
    eyebrow: "FINANCIAL DOCUMENTS",
    title: "Invoices",
    description:
      "Select approved earnings and securely submit your invoice.",
    loading: "Loading...",
    refreshData: "Refresh Data",
    newInvoice: "NEW INVOICE",
    earningsSelection: "Earnings Selection",
    earningsDescription:
      "Only administrator-approved records that have not yet been invoiced are listed.",
    loadingEarnings: "Loading earnings...",
    noApprovedEarnings:
      "No approved earnings are ready for invoicing.",
    passengerNotSpecified: "Passenger not specified",
    selectedEarningsSuffix: "earnings selected",
    invoiceNumber: "Invoice Number *",
    invoiceDate: "Invoice Date *",
    dueDate: "Due Date",
    currency: "Currency *",
    invoiceFile:
      "Invoice File * (PDF/JPG/PNG, max 10 MB)",
    supplierNote: "Supplier Note",
    chooseFile: "Choose File",
    noFileSelected: "No file selected",
    changeFile: "Change File",
    euro: "Euro",
    dollar: "US Dollar",
    turkishLira: "Turkish Lira",
    pound: "Pound Sterling",
    submitting: "Submitting Invoice...",
    submitInvoice: "Submit Invoice",
    invoiceHistory: "INVOICE HISTORY",
    submittedInvoices: "Submitted Invoices",
    recordsDisplayed: "records displayed",
    loadingInvoices: "Loading invoices...",
    noInvoices: "No invoices have been submitted yet.",
    earnings: "Earnings",
    records: "Records",
    file: "File",
    downloadInvoice: "Download Invoice",
    submittedStatus: "Under Review",
    approvedStatus: "Approved",
    revisionRequestedStatus: "Revision Requested",
    rejectedStatus: "Rejected",
  },

  es: {
    loadError: "No se pudo cargar la información de las facturas.",
    selectEarningError:
      "Seleccione al menos una ganancia aprobada para incluirla en la factura.",
    selectFileError:
      "Seleccione un archivo de factura PDF, JPG o PNG.",
    submitSuccess: "Factura enviada correctamente.",
    submitError: "No se pudo enviar la factura.",
    eyebrow: "DOCUMENTOS FINANCIEROS",
    title: "Facturas",
    description:
      "Seleccione las ganancias aprobadas y envíe su factura de forma segura.",
    loading: "Cargando...",
    refreshData: "Actualizar Datos",
    newInvoice: "NUEVA FACTURA",
    earningsSelection: "Selección de Ganancias",
    earningsDescription:
      "Solo se muestran los registros aprobados por el administrador que aún no han sido facturados.",
    loadingEarnings: "Cargando ganancias...",
    noApprovedEarnings:
      "No hay ganancias aprobadas listas para facturar.",
    passengerNotSpecified: "Pasajero no especificado",
    selectedEarningsSuffix: "ganancias seleccionadas",
    invoiceNumber: "Número de Factura *",
    invoiceDate: "Fecha de Factura *",
    dueDate: "Fecha de Vencimiento",
    currency: "Moneda *",
    invoiceFile:
      "Archivo de Factura * (PDF/JPG/PNG, máx. 10 MB)",
    supplierNote: "Nota del Proveedor",
    chooseFile: "Elegir Archivo",
    noFileSelected: "Ningún archivo seleccionado",
    changeFile: "Cambiar Archivo",
    euro: "Euro",
    dollar: "Dólar estadounidense",
    turkishLira: "Lira turca",
    pound: "Libra esterlina",
    submitting: "Enviando Factura...",
    submitInvoice: "Enviar Factura",
    invoiceHistory: "HISTORIAL DE FACTURAS",
    submittedInvoices: "Facturas Enviadas",
    recordsDisplayed: "registros mostrados",
    loadingInvoices: "Cargando facturas...",
    noInvoices: "Aún no se han enviado facturas.",
    earnings: "Ganancias",
    records: "Registros",
    file: "Archivo",
    downloadInvoice: "Descargar Factura",
    submittedStatus: "En Revisión",
    approvedStatus: "Aprobada",
    revisionRequestedStatus: "Revisión Solicitada",
    rejectedStatus: "Rechazada",
  },

  ar: {
    loadError: "تعذر تحميل معلومات الفواتير.",
    selectEarningError:
      "اختر مستحقاً معتمداً واحداً على الأقل لإضافته إلى الفاتورة.",
    selectFileError:
      "اختر ملف فاتورة بصيغة PDF أو JPG أو PNG.",
    submitSuccess: "تم إرسال الفاتورة بنجاح.",
    submitError: "تعذر إرسال الفاتورة.",
    eyebrow: "المستندات المالية",
    title: "الفواتير",
    description:
      "اختر المستحقات المعتمدة وأرسل فاتورتك بأمان.",
    loading: "جارٍ التحميل...",
    refreshData: "تحديث البيانات",
    newInvoice: "فاتورة جديدة",
    earningsSelection: "اختيار المستحقات",
    earningsDescription:
      "تُعرض فقط السجلات المعتمدة من الإدارة والتي لم تتم فوترتها بعد.",
    loadingEarnings: "جارٍ تحميل المستحقات...",
    noApprovedEarnings:
      "لا توجد مستحقات معتمدة جاهزة للفوترة.",
    passengerNotSpecified: "المسافر غير محدد",
    selectedEarningsSuffix: "مستحقات محددة",
    invoiceNumber: "رقم الفاتورة *",
    invoiceDate: "تاريخ الفاتورة *",
    dueDate: "تاريخ الاستحقاق",
    currency: "العملة *",
    invoiceFile:
      "ملف الفاتورة * (PDF/JPG/PNG، بحد أقصى 10 MB)",
    supplierNote: "ملاحظة المورد",
    chooseFile: "اختيار ملف",
    noFileSelected: "لم يتم اختيار ملف",
    changeFile: "تغيير الملف",
    euro: "يورو",
    dollar: "دولار أمريكي",
    turkishLira: "ليرة تركية",
    pound: "جنيه إسترليني",
    submitting: "جارٍ إرسال الفاتورة...",
    submitInvoice: "إرسال الفاتورة",
    invoiceHistory: "سجل الفواتير",
    submittedInvoices: "الفواتير المرسلة",
    recordsDisplayed: "سجلات معروضة",
    loadingInvoices: "جارٍ تحميل الفواتير...",
    noInvoices: "لم يتم إرسال فواتير بعد.",
    earnings: "المستحقات",
    records: "السجلات",
    file: "الملف",
    downloadInvoice: "تنزيل الفاتورة",
    submittedStatus: "قيد المراجعة",
    approvedStatus: "معتمدة",
    revisionRequestedStatus: "مطلوب تعديل",
    rejectedStatus: "مرفوضة",
  },
};

export default function SupplierInvoicesPage() {
  const { language } = useLanguage();
  const t = TEXT[language] || TEXT.en;

  const locale =
    {
      tr: "tr-TR",
      en: "en-GB",
      es: "es-ES",
      ar: "ar-SA",
    }[language] || "en-GB";

  const statusLabels = {
    submitted: t.submittedStatus,
    approved: t.approvedStatus,
    revision_requested: t.revisionRequestedStatus,
    rejected: t.rejectedStatus,
  };

  const fileInputRef = useRef(null);

  const [invoices, setInvoices] = useState([]);
  const [approvedFinancials, setApprovedFinancials] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [form, setForm] = useState(createInitialForm);
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

      setInvoices(
        Array.isArray(invoiceResponse?.data)
          ? invoiceResponse.data
          : [],
      );

      setApprovedFinancials(
        Array.isArray(financialResponse?.data)
          ? financialResponse.data
          : [],
      );
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          t.loadError,
      );
    } finally {
      setLoading(false);
    }
  }, [t.loadError]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const selectedFinancials = useMemo(
    () =>
      approvedFinancials.filter((item) =>
        selectedIds.includes(Number(item.id)),
      ),
    [approvedFinancials, selectedIds],
  );

  const selectedTotal = useMemo(
    () =>
      selectedFinancials.reduce(
        (sum, item) =>
          sum + Number(item.supplier_amount || 0),
        0,
      ),
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
      setError(t.selectEarningError);
      return;
    }

    if (!form.file) {
      setError(t.selectFileError);
      return;
    }

    setSaving(true);

    try {
      const payload = new FormData();

      payload.append(
        "invoice_number",
        form.invoiceNumber.trim(),
      );

      payload.append(
        "invoice_date",
        form.invoiceDate,
      );

      if (form.dueDate) {
        payload.append(
          "due_date",
          form.dueDate,
        );
      }

      payload.append(
        "amount",
        selectedTotal.toFixed(2),
      );

      payload.append(
        "currency",
        form.currency,
      );

      payload.append(
        "file",
        form.file,
      );

      if (form.note.trim()) {
        payload.append(
          "note",
          form.note.trim(),
        );
      }

      selectedIds.forEach((id) =>
        payload.append(
          "financial_ids[]",
          String(id),
        ),
      );

      const response =
        await createSupplierInvoice(payload);

      setMessage(
        response?.message ||
          t.submitSuccess,
      );

      setForm(createInitialForm());
      setSelectedIds([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadPage();
    } catch (requestError) {
      const errors =
        requestError?.response?.data?.errors;

      const firstValidationError =
        errors
          ? Object.values(errors)
              .flat()
              .find(Boolean)
          : null;

      setError(
        firstValidationError ||
          requestError?.response?.data?.message ||
          requestError?.message ||
          t.submitError,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="supplier-invoices-page">
      <header className="supplier-invoices-hero">
        <div>
          <span>{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.description}</p>
        </div>

        <button
          type="button"
          onClick={loadPage}
          disabled={loading}
        >
          {loading
            ? t.loading
            : t.refreshData}
        </button>
      </header>

      {error && (
        <div className="supplier-invoice-message error">
          {error}
        </div>
      )}

      {message && (
        <div className="supplier-invoice-message success">
          {message}
        </div>
      )}

      <section className="supplier-invoice-grid">
        <form
          className="supplier-invoice-form"
          onSubmit={handleSubmit}
        >
          <div className="section-title">
            <span>{t.newInvoice}</span>
            <h2>{t.earningsSelection}</h2>
            <p>{t.earningsDescription}</p>
          </div>

          <div className="approved-financial-list">
            {loading ? (
              <div className="invoice-empty">
                {t.loadingEarnings}
              </div>
            ) : approvedFinancials.length === 0 ? (
              <div className="invoice-empty">
                {t.noApprovedEarnings}
              </div>
            ) : (
              approvedFinancials.map((financial) => (
                <label
                  className="approved-financial-row"
                  key={financial.id}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(
                      Number(financial.id),
                    )}
                    onChange={() =>
                      toggleFinancial(financial.id)
                    }
                  />

                  <div>
                    <strong>
                      {financial.booking_reference}
                    </strong>

                    <small>
                      {financial.passenger_name ||
                        t.passengerNotSpecified}
                    </small>
                  </div>

                  <span>
                    {formatDate(
                      financial.pickup_time,
                      locale,
                    )}
                  </span>

                  <b>
                    {formatMoney(
                      financial.supplier_amount,
                      financial.currency,
                      locale,
                    )}
                  </b>
                </label>
              ))
            )}
          </div>

          <div className="invoice-selected-total">
            <span>
              {selectedIds.length}{" "}
              {t.selectedEarningsSuffix}
            </span>

            <strong>
              {formatMoney(
                selectedTotal,
                form.currency,
                locale,
              )}
            </strong>
          </div>

          <div className="invoice-form-fields">
            <label>
              <span>{t.invoiceNumber}</span>
              <input
                required
                maxLength="100"
                value={form.invoiceNumber}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    invoiceNumber:
                      event.target.value,
                  }))
                }
              />
            </label>

            <label>
              <span>{t.invoiceDate}</span>
              <input
                required
                type="date"
                value={form.invoiceDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    invoiceDate:
                      event.target.value,
                  }))
                }
              />
            </label>

            <label>
              <span>{t.dueDate}</span>
              <input
                type="date"
                min={form.invoiceDate}
                value={form.dueDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    dueDate:
                      event.target.value,
                  }))
                }
              />
            </label>

            <label>
              <span>{t.currency}</span>
              <select
                value={form.currency}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    currency:
                      event.target.value,
                  }))
                }
              >
                <option value="EUR">
                  EUR — {t.euro}
                </option>
                <option value="USD">
                  USD — {t.dollar}
                </option>
                <option value="TRY">
                  TRY — {t.turkishLira}
                </option>
                <option value="GBP">
                  GBP — {t.pound}
                </option>
              </select>
            </label>

            <label className="wide">
              <span>{t.invoiceFile}</span>

              <input
                ref={fileInputRef}
                required
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    file:
                      event.target.files?.[0] ||
                      null,
                  }))
                }
                style={{
                  position: "absolute",
                  width: "1px",
                  height: "1px",
                  opacity: 0,
                  pointerEvents: "none",
                }}
              />

              <div
                className="supplier-invoice-file-picker"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  minHeight: "42px",
                }}
              >
                <button
                  type="button"
                  className="supplier-secondary-button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                >
                  {form.file
                    ? t.changeFile
                    : t.chooseFile}
                </button>

                <span>
                  {form.file?.name ||
                    t.noFileSelected}
                </span>
              </div>
            </label>

            <label className="wide">
              <span>{t.supplierNote}</span>
              <textarea
                maxLength="2000"
                value={form.note}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    note:
                      event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <button
            className="submit-invoice"
            type="submit"
            disabled={
              saving ||
              selectedIds.length === 0
            }
          >
            {saving
              ? t.submitting
              : t.submitInvoice}
          </button>
        </form>

        <section className="supplier-invoice-history">
          <div className="section-title">
            <span>{t.invoiceHistory}</span>
            <h2>{t.submittedInvoices}</h2>
            <p>
              {invoices.length}{" "}
              {t.recordsDisplayed}
            </p>
          </div>

          {loading ? (
            <div className="invoice-empty">
              {t.loadingInvoices}
            </div>
          ) : invoices.length === 0 ? (
            <div className="invoice-empty">
              {t.noInvoices}
            </div>
          ) : (
            <div className="invoice-history-list">
              {invoices.map((invoice) => (
                <article key={invoice.id}>
                  <div className="invoice-history-head">
                    <div>
                      <strong>
                        {invoice.invoice_number}
                      </strong>

                      <small>
                        {formatDate(
                          invoice.invoice_date,
                          locale,
                        )}
                      </small>
                    </div>

                    <span
                      className={`invoice-status ${invoice.status}`}
                    >
                      {statusLabels[
                        invoice.status
                      ] ||
                        invoice.status}
                    </span>
                  </div>

                  <div className="invoice-history-details">
                    <span>
                      {t.earnings}{" "}
                      <b>
                        {formatMoney(
                          invoice.amount,
                          invoice.currency,
                          locale,
                        )}
                      </b>
                    </span>

                    <span>
                      {t.records}{" "}
                      <b>
                        {invoice.financial_count ||
                          0}
                      </b>
                    </span>

                    <span>
                      {t.file}{" "}
                      <b>
                        {invoice.original_name}
                      </b>
                    </span>
                  </div>

                  {invoice.rejection_reason && (
                    <p className="invoice-review-note">
                      {invoice.rejection_reason}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      downloadSupplierInvoice(
                        invoice.id,
                        invoice.original_name,
                      )
                    }
                  >
                    {t.downloadInvoice}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function formatMoney(
  value,
  currency = "EUR",
  locale = "en-GB",
) {
  return new Intl.NumberFormat(
    locale,
    {
      style: "currency",
      currency:
        currency || "EUR",
    },
  ).format(
    Number(value || 0),
  );
}

function formatDate(
  value,
  locale = "en-GB",
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  return Number.isNaN(
    date.getTime(),
  )
    ? "—"
    : date.toLocaleDateString(
        locale,
      );
}

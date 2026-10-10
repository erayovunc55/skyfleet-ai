import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "../i18n";
import { getSupplierFinancials } from "../services/supplierService";
import "./supplier-finance-page.css";

const TEXT = {
  tr: {
    financeCenter: "FİNANS MERKEZİ",
    title: "Hakedişlerim",
    description:
      "Onaylanan transferlerinizi, vadelerinizi ve ödeme geçmişinizi izleyin.",
    loading: "Yükleniyor...",
    refreshData: "Verileri Yenile",
    currentFinancialData: "Güncel finans verisi",

    totalEarnings: "Toplam Hakediş",
    pending: "Bekleyen",
    approved: "Onaylanan",
    paid: "Ödenen",

    searchEarnings: "Hakediş ara",
    searchPlaceholder: "SF numarası, yolcu veya güzergâh...",
    status: "Durum",
    allStatuses: "Tüm durumlar",
    pendingStatus: "Bekliyor",
    approvedStatus: "Onaylandı",
    paidStatus: "Ödendi",
    disputedStatus: "İtirazlı",
    cancelledStatus: "İptal",
    start: "Başlangıç",
    end: "Bitiş",
    filter: "Filtrele",
    clear: "Temizle",

    earningsRecords: "Hakediş Kayıtları",
    recordsDisplayed: "kayıt görüntüleniyor",
    loadingEarnings: "Hakedişler yükleniyor...",
    noEarnings: "Filtrelere uygun hakediş bulunamadı.",
    emptyEarningsHint:
      "Hakediş kayıtlarınız burada görüntülenir. Filtreleri temizleyebilir veya verileri yenileyebilirsiniz.",

    reservation: "Rezervasyon",
    date: "Tarih",
    route: "Güzergâh",
    earnings: "Hakediş",
    dueDate: "Vade",
    payment: "Ödeme",
    passengerNotSpecified: "Yolcu belirtilmedi",

    previous: "Önceki",
    next: "Sonraki",
    page: "Sayfa",

    loadError: "Hakediş kayıtları yüklenemedi.",
  },

  en: {
    financeCenter: "FINANCE CENTER",
    title: "Earnings",
    description:
      "Track your approved transfers, due dates and payment history.",
    loading: "Loading...",
    refreshData: "Refresh Data",
    currentFinancialData: "Current financial data",

    totalEarnings: "Total Earnings",
    pending: "Pending",
    approved: "Approved",
    paid: "Paid",

    searchEarnings: "Search earnings",
    searchPlaceholder: "SF number, passenger or route...",
    status: "Status",
    allStatuses: "All statuses",
    pendingStatus: "Pending",
    approvedStatus: "Approved",
    paidStatus: "Paid",
    disputedStatus: "Disputed",
    cancelledStatus: "Cancelled",
    start: "Start",
    end: "End",
    filter: "Filter",
    clear: "Clear",

    earningsRecords: "Earnings Records",
    recordsDisplayed: "records displayed",
    loadingEarnings: "Loading earnings...",
    noEarnings: "No earnings matched the filters.",
    emptyEarningsHint:
      "Your earnings records will appear here. Clear the filters or refresh the data.",

    reservation: "Reservation",
    date: "Date",
    route: "Route",
    earnings: "Earnings",
    dueDate: "Due Date",
    payment: "Payment",
    passengerNotSpecified: "Passenger not specified",

    previous: "Previous",
    next: "Next",
    page: "Page",

    loadError: "Earnings records could not be loaded.",
  },

  es: {
    financeCenter: "CENTRO FINANCIERO",
    title: "Ganancias",
    description:
      "Consulte sus traslados aprobados, fechas de vencimiento e historial de pagos.",
    loading: "Cargando...",
    refreshData: "Actualizar Datos",
    currentFinancialData: "Datos financieros actuales",

    totalEarnings: "Ganancias Totales",
    pending: "Pendiente",
    approved: "Aprobado",
    paid: "Pagado",

    searchEarnings: "Buscar ganancias",
    searchPlaceholder: "Número SF, pasajero o ruta...",
    status: "Estado",
    allStatuses: "Todos los estados",
    pendingStatus: "Pendiente",
    approvedStatus: "Aprobado",
    paidStatus: "Pagado",
    disputedStatus: "En disputa",
    cancelledStatus: "Cancelado",
    start: "Inicio",
    end: "Fin",
    filter: "Filtrar",
    clear: "Limpiar",

    earningsRecords: "Registros de Ganancias",
    recordsDisplayed: "registros mostrados",
    loadingEarnings: "Cargando ganancias...",
    noEarnings: "No se encontraron ganancias con estos filtros.",
    emptyEarningsHint:
      "Sus registros de ganancias aparecerán aquí. Limpie los filtros o actualice los datos.",

    reservation: "Reserva",
    date: "Fecha",
    route: "Ruta",
    earnings: "Ganancias",
    dueDate: "Vencimiento",
    payment: "Pago",
    passengerNotSpecified: "Pasajero no especificado",

    previous: "Anterior",
    next: "Siguiente",
    page: "Página",

    loadError: "No se pudieron cargar los registros de ganancias.",
  },

  ar: {
    financeCenter: "المركز المالي",
    title: "الأرباح",
    description:
      "تابع الرحلات المعتمدة وتواريخ الاستحقاق وسجل المدفوعات.",
    loading: "جارٍ التحميل...",
    refreshData: "تحديث البيانات",
    currentFinancialData: "البيانات المالية الحالية",

    totalEarnings: "إجمالي الأرباح",
    pending: "قيد الانتظار",
    approved: "معتمد",
    paid: "مدفوع",

    searchEarnings: "البحث في الأرباح",
    searchPlaceholder: "رقم SF أو المسافر أو المسار...",
    status: "الحالة",
    allStatuses: "كل الحالات",
    pendingStatus: "قيد الانتظار",
    approvedStatus: "معتمد",
    paidStatus: "مدفوع",
    disputedStatus: "متنازع عليه",
    cancelledStatus: "ملغي",
    start: "البداية",
    end: "النهاية",
    filter: "تصفية",
    clear: "مسح",

    earningsRecords: "سجلات الأرباح",
    recordsDisplayed: "سجلات معروضة",
    loadingEarnings: "جارٍ تحميل الأرباح...",
    noEarnings: "لا توجد أرباح مطابقة للفلاتر.",
    emptyEarningsHint:
      "ستظهر سجلات أرباحك هنا. امسح عوامل التصفية أو حدّث البيانات.",

    reservation: "الحجز",
    date: "التاريخ",
    route: "المسار",
    earnings: "الأرباح",
    dueDate: "تاريخ الاستحقاق",
    payment: "الدفع",
    passengerNotSpecified: "المسافر غير محدد",

    previous: "السابق",
    next: "التالي",
    page: "الصفحة",

    loadError: "تعذر تحميل سجلات الأرباح.",
  },
};

export default function SupplierFinancePage() {
  const { language } = useLanguage();
  const t = TEXT[language] || TEXT.en;

  const locale =
    {
      tr: "tr-TR",
      en: "en-GB",
      es: "es-ES",
      ar: "ar-SA",
    }[language] || "en-GB";

  const statusOptions = [
    ["", t.allStatuses],
    ["pending", t.pendingStatus],
    ["approved", t.approvedStatus],
    ["paid", t.paidStatus],
    ["disputed", t.disputedStatus],
    ["cancelled", t.cancelledStatus],
  ];

  const statusLabels = {
    pending: t.pendingStatus,
    approved: t.approvedStatus,
    paid: t.paidStatus,
    disputed: t.disputedStatus,
    cancelled: t.cancelledStatus,
  };

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    dateFrom: "",
    dateTo: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadFinancials = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getSupplierFinancials({
        ...appliedFilters,
        page,
        perPage: 25,
      });

      setRecords(
        Array.isArray(response?.data)
          ? response.data
          : [],
      );

      setSummary(
        Array.isArray(response?.summary)
          ? response.summary
          : [],
      );

      setMeta(
        response?.meta || {
          current_page: 1,
          last_page: 1,
          total: 0,
        },
      );
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          t.loadError,
      );

      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [
    appliedFilters,
    page,
    t.loadError,
  ]);

  useEffect(() => {
    loadFinancials();
  }, [loadFinancials]);

  const cards = useMemo(() => {
    const currency =
      summary[0]?.currency || "EUR";

    const total = (key) =>
      summary.reduce(
        (sum, row) =>
          sum + Number(row?.[key] || 0),
        0,
      );

    return [
      [
        t.totalEarnings,
        total("total_amount"),
        "total",
      ],
      [
        t.pending,
        total("pending_amount"),
        "pending",
      ],
      [
        t.approved,
        total("approved_amount"),
        "approved",
      ],
      [
        t.paid,
        total("paid_amount"),
        "paid",
      ],
    ].map(
      ([
        label,
        amount,
        tone,
      ]) => ({
        label,
        amount,
        tone,
        currency,
      }),
    );
  }, [
    summary,
    t.totalEarnings,
    t.pending,
    t.approved,
    t.paid,
  ]);

  function applyFilters(event) {
    event.preventDefault();
    setPage(1);
    setAppliedFilters({
      ...filters,
    });
  }

  function clearFilters() {
    const empty = {
      search: "",
      status: "",
      dateFrom: "",
      dateTo: "",
    };

    setFilters(empty);
    setAppliedFilters(empty);
    setPage(1);
  }

  return (
    <main className="supplier-finance-page">
      <header className="supplier-finance-hero">
        <div>
          <span className="supplier-finance-eyebrow">
            {t.financeCenter}
          </span>

          <h1>
            {t.title}
          </h1>

          <p>
            {t.description}
          </p>
        </div>

        <button
          type="button"
          onClick={loadFinancials}
          disabled={loading}
        >
          {loading
            ? t.loading
            : t.refreshData}
        </button>
      </header>

      <section className="supplier-finance-stats">
        {cards.map((card) => (
          <article
            key={card.label}
            className={`supplier-finance-stat ${card.tone}`}
          >
            <span>
              {card.label}
            </span>

            <strong>
              {formatMoney(
                card.amount,
                card.currency,
                locale,
              )}
            </strong>

            <small>
              {t.currentFinancialData}
            </small>
          </article>
        ))}
      </section>

      <form
        className="supplier-finance-filters"
        onSubmit={applyFilters}
      >
        <label>
          <span>
            {t.searchEarnings}
          </span>

          <input
            value={filters.search}
            placeholder={
              t.searchPlaceholder
            }
            onChange={(event) =>
              setFilters(
                (current) => ({
                  ...current,
                  search:
                    event.target.value,
                }),
              )
            }
          />
        </label>

        <label>
          <span>
            {t.status}
          </span>

          <select
            value={filters.status}
            onChange={(event) =>
              setFilters(
                (current) => ({
                  ...current,
                  status:
                    event.target.value,
                }),
              )
            }
          >
            {statusOptions.map(
              ([
                value,
                label,
              ]) => (
                <option
                  key={value}
                  value={value}
                >
                  {label}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          <span>
            {t.start}
          </span>

          <input
            type="date"
            value={filters.dateFrom}
            onChange={(event) =>
              setFilters(
                (current) => ({
                  ...current,
                  dateFrom:
                    event.target.value,
                }),
              )
            }
          />
        </label>

        <label>
          <span>
            {t.end}
          </span>

          <input
            type="date"
            value={filters.dateTo}
            onChange={(event) =>
              setFilters(
                (current) => ({
                  ...current,
                  dateTo:
                    event.target.value,
                }),
              )
            }
          />
        </label>

        <button type="submit">
          {t.filter}
        </button>

        <button
          type="button"
          className="secondary"
          onClick={clearFilters}
        >
          {t.clear}
        </button>
      </form>

      {error && (
        <div className="supplier-finance-message error">
          {error}
        </div>
      )}

      <section className="supplier-finance-table-card">
        <div className="supplier-finance-table-heading">
          <div>
            <h2>
              {t.earningsRecords}
            </h2>

            <p>
              {meta.total || 0}
              {" "}
              {t.recordsDisplayed}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="supplier-finance-empty">
            {t.loadingEarnings}
          </div>
        ) : records.length === 0 ? (
          <div className="supplier-finance-empty-state" role="status">
            <span className="supplier-finance-empty-icon" aria-hidden="true">
              €
            </span>
            <strong>{t.noEarnings}</strong>
            <p>{t.emptyEarningsHint}</p>
          </div>
        ) : (
          <div className="supplier-finance-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t.reservation}</th>
                  <th>{t.date}</th>
                  <th>{t.route}</th>
                  <th>{t.earnings}</th>
                  <th>{t.dueDate}</th>
                  <th>{t.payment}</th>
                  <th>{t.status}</th>
                </tr>
              </thead>

              <tbody>
                {records.map(
                  (record) => (
                    <tr key={record.id}>
                      <td>
                        <strong>
                          {record.booking_reference ||
                            `#${record.transfer_id}`}
                        </strong>

                        <small>
                          {record.passenger_name ||
                            t.passengerNotSpecified}
                        </small>
                      </td>

                      <td>
                        {formatDateTime(
                          record.pickup_time,
                          locale,
                        )}
                      </td>

                      <td className="route">
                        <span>
                          {record.pickup ||
                            "—"}
                        </span>

                        <b>
                          →
                        </b>

                        <span>
                          {record.dropoff ||
                            "—"}
                        </span>
                      </td>

                      <td className="amount">
                        {formatMoney(
                          record.supplier_amount,
                          record.currency,
                          locale,
                        )}
                      </td>

                      <td>
                        {formatDate(
                          record.due_at,
                          locale,
                        )}
                      </td>

                      <td>
                        <span>
                          {record.paid_at
                            ? formatDate(
                                record.paid_at,
                                locale,
                              )
                            : "—"}
                        </span>

                        <small>
                          {record.payment_reference ||
                            ""}
                        </small>
                      </td>

                      <td>
                        <span
                          className={`supplier-finance-status ${record.status}`}
                        >
                          {statusLabels[
                            record.status
                          ] ||
                            record.status}
                        </span>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}

        {meta.last_page > 1 && (
          <div className="supplier-finance-pagination">
            <button
              type="button"
              disabled={
                page <= 1 ||
                loading
              }
              onClick={() =>
                setPage(
                  (value) =>
                    value - 1,
                )
              }
            >
              ← {t.previous}
            </button>

            <span>
              {t.page}{" "}
              {meta.current_page} /{" "}
              {meta.last_page}
            </span>

            <button
              type="button"
              disabled={
                page >=
                  meta.last_page ||
                loading
              }
              onClick={() =>
                setPage(
                  (value) =>
                    value + 1,
                )
              }
            >
              {t.next} →
            </button>
          </div>
        )}
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

function formatDateTime(
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
    : date.toLocaleString(
        locale,
        {
          dateStyle: "medium",
          timeStyle: "short",
        },
      );
}

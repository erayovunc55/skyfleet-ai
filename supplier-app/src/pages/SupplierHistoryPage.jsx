import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "../i18n";
import { getSupplierHistoryTransfers } from "../services/supplierService";

const TEXT = {
  tr: {
    archive: "ARŞİV",
    title: "Geçmiş Transferler",
    description:
      "Tamamlanan, No Show ve iptal edilen operasyonları burada görüntüleyin.",
    loading: "Yükleniyor...",
    refresh: "Yenile",
    totalHistory: "Toplam Geçmiş",
    completed: "Tamamlanan",
    noShow: "No Show",
    cancelled: "İptal",
    searchHistory: "Geçmişte ara",
    searchPlaceholder:
      "SF numarası, yolcu, uçuş veya adres...",
    status: "Durum",
    allHistory: "Tüm geçmiş",
    cancelledStatus: "İptal Edildi",
    clear: "Temizle",
    operationHistory: "Operasyon Geçmişi",
    records: "kayıt",
    loadingHistory:
      "Geçmiş transferler yükleniyor...",
    noHistory:
      "Bu filtrelere uygun geçmiş transfer bulunmuyor.",
    passengerNotSpecified:
      "Yolcu belirtilmedi",
    dateNotSpecified:
      "Tarih belirtilmedi",
    loadError:
      "Geçmiş transferler yüklenemedi.",
  },

  en: {
    archive: "ARCHIVE",
    title: "Transfer History",
    description:
      "View completed, no-show and cancelled operations here.",
    loading: "Loading...",
    refresh: "Refresh",
    totalHistory: "Total History",
    completed: "Completed",
    noShow: "No Show",
    cancelled: "Cancelled",
    searchHistory: "Search history",
    searchPlaceholder:
      "SF number, passenger, flight or address...",
    status: "Status",
    allHistory: "All history",
    cancelledStatus: "Cancelled",
    clear: "Clear",
    operationHistory: "Operation History",
    records: "records",
    loadingHistory:
      "Loading transfer history...",
    noHistory:
      "No historical transfers match these filters.",
    passengerNotSpecified:
      "Passenger not specified",
    dateNotSpecified:
      "Date not specified",
    loadError:
      "Transfer history could not be loaded.",
  },

  es: {
    archive: "ARCHIVO",
    title: "Historial de Traslados",
    description:
      "Consulta aquí las operaciones completadas, no presentadas y canceladas.",
    loading: "Cargando...",
    refresh: "Actualizar",
    totalHistory: "Historial Total",
    completed: "Completados",
    noShow: "No presentado",
    cancelled: "Cancelados",
    searchHistory: "Buscar en el historial",
    searchPlaceholder:
      "Número SF, pasajero, vuelo o dirección...",
    status: "Estado",
    allHistory: "Todo el historial",
    cancelledStatus: "Cancelado",
    clear: "Limpiar",
    operationHistory: "Historial de Operaciones",
    records: "registros",
    loadingHistory:
      "Cargando historial de traslados...",
    noHistory:
      "No hay traslados históricos que coincidan con estos filtros.",
    passengerNotSpecified:
      "Pasajero no especificado",
    dateNotSpecified:
      "Fecha no especificada",
    loadError:
      "No se pudo cargar el historial de traslados.",
  },

  ar: {
    archive: "الأرشيف",
    title: "سجل الرحلات",
    description:
      "اعرض هنا الرحلات المكتملة وحالات عدم الحضور والرحلات الملغاة.",
    loading: "جارٍ التحميل...",
    refresh: "تحديث",
    totalHistory: "إجمالي السجل",
    completed: "مكتملة",
    noShow: "عدم حضور",
    cancelled: "ملغاة",
    searchHistory: "البحث في السجل",
    searchPlaceholder:
      "رقم SF أو المسافر أو الرحلة أو العنوان...",
    status: "الحالة",
    allHistory: "كل السجل",
    cancelledStatus: "ملغاة",
    clear: "مسح",
    operationHistory: "سجل العمليات",
    records: "سجلات",
    loadingHistory:
      "جارٍ تحميل سجل الرحلات...",
    noHistory:
      "لا توجد رحلات تاريخية مطابقة لهذه الفلاتر.",
    passengerNotSpecified:
      "المسافر غير محدد",
    dateNotSpecified:
      "التاريخ غير محدد",
    loadError:
      "تعذر تحميل سجل الرحلات.",
  },
};

const STATUS_LABELS = {
  tr: {
    completed: "Tamamlandı",
    no_show: "No Show",
    cancelled: "İptal Edildi",
  },
  en: {
    completed: "Completed",
    no_show: "No Show",
    cancelled: "Cancelled",
  },
  es: {
    completed: "Completado",
    no_show: "No presentado",
    cancelled: "Cancelado",
  },
  ar: {
    completed: "مكتمل",
    no_show: "عدم حضور",
    cancelled: "ملغي",
  },
};

export default function SupplierHistoryPage() {
  const { language } = useLanguage();

  const t = TEXT[language] || TEXT.en;
  const statusLabels =
    STATUS_LABELS[language] || STATUS_LABELS.en;

  const locale =
    {
      tr: "tr-TR",
      en: "en-GB",
      es: "es-ES",
      ar: "ar-SA",
    }[language] || "en-GB";

  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response =
        await getSupplierHistoryTransfers();

      setTransfers(
        Array.isArray(response?.data)
          ? response.data
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
    loadHistory();
  }, [loadHistory]);

  const visibleTransfers = useMemo(() => {
    const query = search
      .trim()
      .toLocaleLowerCase(locale);

    return transfers.filter((transfer) => {
      if (
        status &&
        transfer.status !== status
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        transfer.booking_reference,
        transfer.passenger_name,
        transfer.flight_number,
        transfer.pickup,
        transfer.dropoff,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase(locale)
        .includes(query);
    });
  }, [
    transfers,
    search,
    status,
    locale,
  ]);

  const completedCount =
    transfers.filter(
      (transfer) =>
        transfer.status === "completed",
    ).length;

  const noShowCount =
    transfers.filter(
      (transfer) =>
        transfer.status === "no_show",
    ).length;

  const cancelledCount =
    transfers.filter(
      (transfer) =>
        transfer.status === "cancelled",
    ).length;

  return (
    <main className="supplier-dashboard supplier-history-page">
      <section className="supplier-page-heading">
        <div>
          <span className="supplier-eyebrow">
            {t.archive}
          </span>

          <h1>
            {t.title}
          </h1>

          <p>
            {t.description}
          </p>
        </div>

        <button
          className="supplier-secondary-button"
          type="button"
          disabled={loading}
          onClick={loadHistory}
        >
          {loading
            ? t.loading
            : t.refresh}
        </button>
      </section>

      {error && (
        <div className="supplier-message error">
          {error}
        </div>
      )}

      <section className="supplier-summary-grid supplier-history-summary">
        <HistorySummary
          label={t.totalHistory}
          value={transfers.length}
        />

        <HistorySummary
          label={t.completed}
          value={completedCount}
        />

        <HistorySummary
          label={t.noShow}
          value={noShowCount}
        />

        <HistorySummary
          label={t.cancelled}
          value={cancelledCount}
        />
      </section>

      <section className="supplier-filter-card supplier-history-filters">
        <label>
          <span>
            {t.searchHistory}
          </span>

          <input
            type="search"
            value={search}
            placeholder={t.searchPlaceholder}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
          />
        </label>

        <label>
          <span>
            {t.status}
          </span>

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value,
              )
            }
          >
            <option value="">
              {t.allHistory}
            </option>

            <option value="completed">
              {t.completed}
            </option>

            <option value="no_show">
              {t.noShow}
            </option>

            <option value="cancelled">
              {t.cancelledStatus}
            </option>
          </select>
        </label>

        <button
          type="button"
          onClick={() => {
            setSearch("");
            setStatus("");
          }}
        >
          {t.clear}
        </button>
      </section>

      <section className="supplier-transfer-card supplier-history-card">
        <div className="supplier-section-heading">
          <div>
            <h2>
              {t.operationHistory}
            </h2>

            <p>
              {visibleTransfers.length}
              {" "}
              {t.records}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="supplier-empty-state">
            {t.loadingHistory}
          </div>
        ) : visibleTransfers.length === 0 ? (
          <div className="supplier-empty-state">
            {t.noHistory}
          </div>
        ) : (
          <div className="supplier-transfer-list">
            {visibleTransfers.map(
              (transfer) => (
                <div
                  className="supplier-transfer-row supplier-history-row"
                  key={transfer.id}
                >
                  <div>
                    <strong>
                      {
                        transfer
                          .booking_reference
                      }
                    </strong>

                    <span>
                      {formatDateTime(
                        transfer
                          .pickup_time,
                        locale,
                        t.dateNotSpecified,
                      )}
                    </span>
                  </div>

                  <div>
                    <strong>
                      {transfer
                        .passenger_name ||
                        t.passengerNotSpecified}
                    </strong>

                    <span>
                      {transfer.pickup}
                      {" → "}
                      {transfer.dropoff}
                    </span>
                  </div>

                  <div>
                    <strong className="supplier-amount">
                      {formatMoney(
                        transfer
                          .supplier_amount,
                        transfer
                          .currency,
                        locale,
                      )}
                    </strong>

                    <span
                      className={`supplier-status supplier-status-${transfer.status}`}
                    >
                      {statusLabels[
                        transfer.status
                      ] ||
                        transfer.status}
                    </span>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function HistorySummary({
  label,
  value,
}) {
  return (
    <article className="supplier-summary-card">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </article>
  );
}

function formatMoney(
  value,
  currency = "EUR",
  locale = "en-GB",
) {
  const amount =
    Number(value || 0);

  try {
    return new Intl.NumberFormat(
      locale,
      {
        style: "currency",
        currency:
          currency || "EUR",
      },
    ).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${
      currency || ""
    }`.trim();
  }
}

function formatDateTime(
  value,
  locale = "en-GB",
  emptyLabel = "Date not specified",
) {
  if (!value) {
    return emptyLabel;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    locale,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}

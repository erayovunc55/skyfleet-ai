import { useEffect, useMemo, useState } from "react";
import { getSupplierHistoryTransfers } from "../services/supplierService";

const STATUS_LABELS = {
  completed: "Tamamlandı",
  no_show: "No Show",
  cancelled: "İptal Edildi",
};

export default function SupplierHistoryPage() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  async function loadHistory() {
    setLoading(true);
    setError("");

    try {
      const response = await getSupplierHistoryTransfers();
      setTransfers(Array.isArray(response?.data) ? response.data : []);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Geçmiş transferler yüklenemedi.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const visibleTransfers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");

    return transfers.filter((transfer) => {
      if (status && transfer.status !== status) return false;
      if (!query) return true;

      return [
        transfer.booking_reference,
        transfer.passenger_name,
        transfer.flight_number,
        transfer.pickup,
        transfer.dropoff,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(query);
    });
  }, [transfers, search, status]);

  const completedCount = transfers.filter(
    (transfer) => transfer.status === "completed",
  ).length;
  const noShowCount = transfers.filter(
    (transfer) => transfer.status === "no_show",
  ).length;
  const cancelledCount = transfers.filter(
    (transfer) => transfer.status === "cancelled",
  ).length;

  return (
    <main className="supplier-dashboard supplier-history-page">
      <section className="supplier-page-heading">
        <div>
          <span className="supplier-eyebrow">ARŞİV</span>
          <h1>Geçmiş Transferler</h1>
          <p>Tamamlanan, No Show ve iptal edilen operasyonları burada görüntüleyin.</p>
        </div>

        <button
          className="supplier-secondary-button"
          type="button"
          disabled={loading}
          onClick={loadHistory}
        >
          {loading ? "Yükleniyor..." : "Yenile"}
        </button>
      </section>

      {error && <div className="supplier-message error">{error}</div>}

      <section className="supplier-summary-grid supplier-history-summary">
        <HistorySummary label="Toplam Geçmiş" value={transfers.length} />
        <HistorySummary label="Tamamlanan" value={completedCount} />
        <HistorySummary label="No Show" value={noShowCount} />
        <HistorySummary label="İptal" value={cancelledCount} />
      </section>

      <section className="supplier-filter-card supplier-history-filters">
        <label>
          <span>Geçmişte ara</span>
          <input
            type="search"
            value={search}
            placeholder="SF numarası, yolcu, uçuş veya adres..."
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <label>
          <span>Durum</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Tüm geçmiş</option>
            <option value="completed">Tamamlandı</option>
            <option value="no_show">No Show</option>
            <option value="cancelled">İptal Edildi</option>
          </select>
        </label>

        <button
          type="button"
          onClick={() => {
            setSearch("");
            setStatus("");
          }}
        >
          Temizle
        </button>
      </section>

      <section className="supplier-transfer-card supplier-history-card">
        <div className="supplier-section-heading">
          <div>
            <h2>Operasyon Geçmişi</h2>
            <p>{visibleTransfers.length} kayıt</p>
          </div>
        </div>

        {loading ? (
          <div className="supplier-empty-state">Geçmiş transferler yükleniyor...</div>
        ) : visibleTransfers.length === 0 ? (
          <div className="supplier-empty-state">Bu filtrelere uygun geçmiş transfer bulunmuyor.</div>
        ) : (
          <div className="supplier-transfer-list">
            {visibleTransfers.map((transfer) => (
              <div className="supplier-transfer-row supplier-history-row" key={transfer.id}>
                <div>
                  <strong>{transfer.booking_reference}</strong>
                  <span>{formatDateTime(transfer.pickup_time)}</span>
                </div>

                <div>
                  <strong>{transfer.passenger_name || "Yolcu belirtilmedi"}</strong>
                  <span>{transfer.pickup} → {transfer.dropoff}</span>
                </div>

                <div>
                  <strong className="supplier-amount">
                    {formatMoney(transfer.supplier_amount, transfer.currency)}
                  </strong>
                  <span className={`supplier-status supplier-status-${transfer.status}`}>
                    {STATUS_LABELS[transfer.status] || transfer.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function HistorySummary({ label, value }) {
  return (
    <article className="supplier-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function formatMoney(value, currency = "EUR") {
  const amount = Number(value || 0);

  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: currency || "EUR",
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency || ""}`.trim();
  }
}

function formatDateTime(value) {
  if (!value) return "Tarih belirtilmedi";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

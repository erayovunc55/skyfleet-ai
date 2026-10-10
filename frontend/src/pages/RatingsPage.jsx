import { useEffect, useMemo, useState } from "react";

import { useLanguage } from "../i18n";
import supplierService from "../modules/suppliers/services/supplierService";
import "../styles/ratings.css";

const COPY = {
  en: {
    eyebrow: "PERFORMANCE INTELLIGENCE",
    title: "Supplier Performance",
    subtitle: "Track service quality and reliability across your supplier network.",
    refresh: "Refresh data",
    suppliers: "Suppliers tracked",
    rated: "Rated suppliers",
    awaiting: "Awaiting data",
    sample: "Completed transfers",
    network: "SUPPLIER SCORECARD",
    tableTitle: "Performance overview",
    supplier: "Supplier",
    status: "Status",
    score: "Reliability score",
    completed: "Completed",
    noShows: "No shows",
    reviews: "Reviews",
    noData: "No rating data has been collected yet",
    noDataDetail: "Scores will appear after completed transfers and supplier reviews are recorded.",
    active: "Operational",
    inactive: "Inactive",
    loading: "Loading performance data...",
    error: "Performance data could not be loaded.",
    retry: "Try again",
    noSuppliers: "No suppliers found.",
  },
  tr: {
    eyebrow: "PERFORMANS ZEKASI",
    title: "Tedarikçi Performansı",
    subtitle: "Tedarikçi ağınızda hizmet kalitesini ve güvenilirliği takip edin.",
    refresh: "Verileri yenile",
    suppliers: "Takip edilen tedarikçi",
    rated: "Puanlanan tedarikçi",
    awaiting: "Veri bekleniyor",
    sample: "Tamamlanan transfer",
    network: "TEDARİKÇİ KARNESİ",
    tableTitle: "Performans özeti",
    supplier: "Tedarikçi",
    status: "Durum",
    score: "Güvenilirlik puanı",
    completed: "Tamamlanan",
    noShows: "No show",
    reviews: "Değerlendirme",
    noData: "Henüz puan verisi toplanmadı",
    noDataDetail: "Tamamlanan transferler ve tedarikçi değerlendirmeleri kaydedildikten sonra puanlar burada görünür.",
    active: "Operasyonel",
    inactive: "Pasif",
    loading: "Performans verileri yükleniyor...",
    error: "Performans verileri yüklenemedi.",
    retry: "Tekrar dene",
    noSuppliers: "Tedarikçi bulunamadı.",
  },
};

export default function RatingsPage() {
  const { language } = useLanguage();
  const text = COPY[language] || COPY.en;
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadSuppliers({ silent = false } = {}) {
    silent ? setRefreshing(true) : setLoading(true);
    setError("");

    try {
      const response = await supplierService.getSuppliers({ per_page: 100 });
      setSuppliers(Array.isArray(response?.data) ? response.data : []);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || text.error);
      setSuppliers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

  const rows = useMemo(() => suppliers.map((supplier) => {
    const performance = supplier.performance || {};
    const score = firstNumber(
      performance.reliability_score,
      supplier.reliability_score,
      supplier.performance_score,
      supplier.rating,
    );

    return {
      ...supplier,
      score,
      completed: firstNumber(performance.completed_transfers, supplier.completed_transfers) || 0,
      noShows: firstNumber(performance.no_show_transfers, supplier.no_show_transfers) || 0,
      reviews: firstNumber(performance.rating_count, supplier.rating_count) || 0,
    };
  }), [suppliers]);

  const ratedCount = rows.filter((row) => row.score !== null || row.reviews > 0).length;
  const completedCount = rows.reduce((total, row) => total + row.completed, 0);

  return (
    <main className="ratings-page">
      <header className="ratings-header">
        <div>
          <span className="ratings-eyebrow">{text.eyebrow}</span>
          <h1>{text.title}</h1>
          <p>{text.subtitle}</p>
        </div>
        <button type="button" className="ratings-refresh" disabled={loading || refreshing} onClick={() => loadSuppliers({ silent: true })}>
          {refreshing ? "..." : `↻ ${text.refresh}`}
        </button>
      </header>

      {error && <div className="ratings-error"><span>{error}</span><button type="button" onClick={() => loadSuppliers()}>{text.retry}</button></div>}

      <section className="ratings-kpi-grid">
        <Kpi label={text.suppliers} value={loading ? "-" : rows.length} tone="blue" />
        <Kpi label={text.rated} value={loading ? "-" : ratedCount} tone="green" />
        <Kpi label={text.awaiting} value={loading ? "-" : Math.max(0, rows.length - ratedCount)} tone="amber" />
        <Kpi label={text.sample} value={loading ? "-" : completedCount} tone="cyan" />
      </section>

      <section className="ratings-panel">
        <div className="ratings-panel-heading">
          <div><span>{text.network}</span><h2>{text.tableTitle}</h2></div>
          <strong>{rows.length}</strong>
        </div>

        {loading ? <div className="ratings-state">{text.loading}</div> : rows.length === 0 ? <div className="ratings-state">{text.noSuppliers}</div> : (
          <div className="ratings-table-wrap">
            <table className="ratings-table">
              <thead><tr><th>{text.supplier}</th><th>{text.status}</th><th>{text.score}</th><th>{text.completed}</th><th>{text.noShows}</th><th>{text.reviews}</th></tr></thead>
              <tbody>{rows.map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.company_name || row.name || `#${row.id}`}</strong><small>{row.country_name || row.country_code || "-"}</small></td>
                  <td><span className={`ratings-status ${row.is_active ? "active" : "inactive"}`}>{row.is_active ? text.active : text.inactive}</span></td>
                  <td>{row.score === null ? <span className="ratings-awaiting">{text.awaiting}</span> : <strong className="ratings-score">{row.score}%</strong>}</td>
                  <td>{row.completed}</td><td>{row.noShows}</td><td>{row.reviews}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      {!loading && rows.length > 0 && ratedCount === 0 && <section className="ratings-empty-callout"><div className="ratings-empty-icon">★</div><div><h2>{text.noData}</h2><p>{text.noDataDetail}</p></div></section>}
    </main>
  );
}

function Kpi({ label, value, tone }) {
  return <article className={`ratings-kpi ${tone}`}><span>{label}</span><strong>{value}</strong></article>;
}

function firstNumber(...values) {
  const value = values.find((candidate) => candidate !== null && candidate !== undefined && candidate !== "" && Number.isFinite(Number(candidate)));
  return value === undefined ? null : Number(value);
}
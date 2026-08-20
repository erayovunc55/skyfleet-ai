import { useCallback, useEffect, useMemo, useState } from "react";
import { acceptAvailableJob, getAvailableJobs } from "../services/jobPoolService";
import "./supplier-available-jobs-page.css";

export default function SupplierAvailableJobsPage({ onOpenMyTransfers }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [generatedAt, setGeneratedAt] = useState(null);

  const loadJobs = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const result = await getAvailableJobs(100);
      setJobs(result.jobs);
      setGeneratedAt(result.meta?.generated_at || new Date().toISOString());
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Açık işler yüklenemedi.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();

    const timer = window.setInterval(() => {
      loadJobs({ silent: true });
    }, 15000);

    return () => window.clearInterval(timer);
  }, [loadJobs]);

  async function handleAccept(job) {
    if (!job?.id || acceptingId) return;

    setAcceptingId(job.id);
    setError("");
    setMessage("");

    try {
      const response = await acceptAvailableJob(job.id);
      setJobs((currentJobs) =>
        currentJobs.filter((item) => Number(item.id) !== Number(job.id)),
      );
      setMessage(
        response?.message ||
          `${job.booking_reference || "Transfer"} şirketinize atandı.`,
      );
    } catch (requestError) {
      const status = requestError?.response?.status;
      const responseMessage = requestError?.response?.data?.message;

      if (status === 409) {
        setJobs((currentJobs) =>
          currentJobs.filter((item) => Number(item.id) !== Number(job.id)),
        );
        setError(
          responseMessage ||
            "Bu iş başka bir tedarikçi tarafından kabul edildi.",
        );
        loadJobs({ silent: true });
      } else {
        setError(
          responseMessage ||
            requestError?.message ||
            "Transfer kabul edilemedi.",
        );
      }
    } finally {
      setAcceptingId(null);
    }
  }

  const totalPotential = useMemo(() => {
    return jobs.reduce((sum, job) => {
      const amount = Number(job?.supplier_amount);
      return Number.isFinite(amount) ? sum + amount : sum;
    }, 0);
  }, [jobs]);

  const currency = jobs[0]?.currency || "EUR";

  return (
    <main className="supplier-job-pool-page">
      <header className="supplier-job-pool-hero">
        <div>
          <span className="supplier-job-pool-eyebrow">SKYFLEET JOB MARKET</span>
          <h1>Açık İşler</h1>
          <p>
            Operasyon bölgenize ve kapasitenize uygun transferleri görün. İlk kabul eden uygun tedarikçi işi alır.
          </p>
        </div>

        <div className="supplier-job-pool-actions">
          <div className="supplier-job-pool-live">
            <span />
            <div>
              <strong>Canlı Havuz</strong>
              <small>{formatGeneratedAt(generatedAt)}</small>
            </div>
          </div>

          <button
            type="button"
            className="supplier-job-pool-refresh"
            disabled={refreshing || loading}
            onClick={() => loadJobs({ silent: true })}
          >
            {refreshing ? "Yenileniyor..." : "Havuzu Yenile"}
          </button>
        </div>
      </header>

      <section className="supplier-job-pool-summary">
        <SummaryCard label="Açık İş" value={jobs.length} detail="Şu an kabul edilebilir" />
        <SummaryCard
          label="Potansiyel Hakediş"
          value={`${formatMoney(totalPotential)} ${currency}`}
          detail="Görünen açık işlerin toplamı"
        />
        <SummaryCard
          label="Atama Modeli"
          value="First Accept"
          detail="İlk uygun kabul işlemi kazanır"
        />
      </section>

      {message && (
        <div className="supplier-job-pool-message success">
          <div>
            <strong>İş kabul edildi</strong>
            <span>{message}</span>
          </div>
          <button type="button" onClick={onOpenMyTransfers}>
            Transferlerime Git
          </button>
        </div>
      )}

      {error && (
        <div className="supplier-job-pool-message error">
          <div>
            <strong>İşlem tamamlanamadı</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="supplier-job-pool-state">Açık işler yükleniyor...</div>
      ) : jobs.length === 0 ? (
        <div className="supplier-job-pool-empty">
          <div className="supplier-job-pool-empty-icon">✓</div>
          <h2>Şu anda uygun açık iş yok</h2>
          <p>
            Yeni uygun transferler oluştuğunda bu ekranda otomatik görünecek. Havuz 15 saniyede bir yenilenir.
          </p>
        </div>
      ) : (
        <section className="supplier-job-pool-grid">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              accepting={acceptingId === job.id}
              disabled={Boolean(acceptingId)}
              onAccept={() => handleAccept(job)}
            />
          ))}
        </section>
      )}
    </main>
  );
}

function JobCard({ job, accepting, disabled, onAccept }) {
  const match = job?.match || {};
  const passengers =
    Number(job?.adult || 0) + Number(job?.child || 0) + Number(job?.baby || 0);
  const bestVehicle = match?.best_vehicle;

  return (
    <article className="supplier-job-card">
      <div className="supplier-job-card-topline">
        <div>
          <span className="supplier-job-reference">
            {job.booking_reference || `TRANSFER #${job.id}`}
          </span>
          <h2>{formatDateTime(job.pickup_time)}</h2>
        </div>

        <div className="supplier-job-payout">
          <small>NET HAKEDİŞ</small>
          <strong>
            {formatMoney(job.supplier_amount)} {job.currency || "EUR"}
          </strong>
        </div>
      </div>

      <div className="supplier-job-route">
        <RoutePoint tone="pickup" label="ALIŞ" value={job.pickup} />
        <div className="supplier-job-route-line" />
        <RoutePoint tone="dropoff" label="BIRAKIŞ" value={job.dropoff} />
      </div>

      <div className="supplier-job-meta-grid">
        <Meta label="Uçuş" value={job.flight_number || "Belirtilmedi"} />
        <Meta label="Araç Tipi" value={job.vehicle_type || "Standart"} />
        <Meta label="Yolcu" value={`${Math.max(passengers, 1)} kişi`} />
        <Meta label="Bagaj" value={`${Number(job.luggage_count || 0)} adet`} />
      </div>

      <div className="supplier-job-match-row">
        <div>
          <span className="supplier-job-score">%{match.score ?? "—"} Uyum</span>
          <small>{formatMatchLevel(match.match_level)}</small>
        </div>

        {bestVehicle && (
          <div className="supplier-job-best-vehicle">
            <span>Önerilen araç</span>
            <strong>
              {bestVehicle.brand} {bestVehicle.model}
            </strong>
            <small>{bestVehicle.plate}</small>
          </div>
        )}
      </div>

      <button
        type="button"
        className="supplier-job-accept-button"
        disabled={disabled}
        onClick={onAccept}
      >
        {accepting ? "İş Kilitleniyor..." : "Transferi Kabul Et"}
      </button>

      <p className="supplier-job-first-accept-note">
        Kabul işlemi tamamlandığı anda transfer şirketinize kilitlenir ve diğer tedarikçilerin havuzundan kaldırılır.
      </p>
    </article>
  );
}

function SummaryCard({ label, value, detail }) {
  return (
    <article className="supplier-job-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function RoutePoint({ tone, label, value }) {
  return (
    <div className={`supplier-job-route-point ${tone}`}>
      <span>{label}</span>
      <strong>{value || "Belirtilmedi"}</strong>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div className="supplier-job-meta">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "Tarih belirtilmedi";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatGeneratedAt(value) {
  if (!value) return "Henüz yenilenmedi";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Canlı";
  return `Son güncelleme ${date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}`;
}

function formatMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "0,00";
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatMatchLevel(level) {
  const labels = {
    full: "Tam kapsama uyumu",
    partial: "Operasyonel kapsama uyumu",
    review: "Manuel kontrol gerekli",
  };
  return labels[level] || "Uygun operasyon";
}

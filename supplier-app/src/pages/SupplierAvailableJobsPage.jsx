import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  acceptAvailableJob,
  getAvailableJobs,
} from "../services/jobPoolService";

import { useLanguage } from "../i18n";

import "./supplier-available-jobs-page.css";

const LOCALES = {
  tr: "tr-TR",
  en: "en-GB",
  es: "es-ES",
  ar: "ar-SA",
};

const TEXT = {
  tr: {
    market: "SKYFLEET JOB MARKET",
    title: "Açık İşler",
    intro:
      "Operasyon bölgenize ve kapasitenize uygun transferleri görün. İlk kabul eden uygun tedarikçi işi alır.",

    livePool: "Canlı Havuz",
    refreshPool: "Havuzu Yenile",
    refreshing: "Yenileniyor...",

    openJobs: "Açık İş",
    availableNow: "Şu an kabul edilebilir",

    potentialEarnings: "Potansiyel Hakediş",
    visibleJobsTotal: "Görünen açık işlerin toplamı",

    assignmentModel: "Atama Modeli",
    firstAccept: "First Accept",
    firstAcceptWins:
      "İlk uygun kabul işlemi kazanır",

    jobAccepted: "İş kabul edildi",
    goToTransfers: "Transferlerime Git",

    operationFailed: "İşlem tamamlanamadı",

    loadingJobs: "Açık işler yükleniyor...",
    noJobs: "Şu anda uygun açık iş yok",
    noJobsDetail:
      "Yeni uygun transferler oluştuğunda bu ekranda otomatik görünecek. Havuz 15 saniyede bir yenilenir.",

    netEarnings: "NET HAKEDİŞ",

    pickup: "ALIŞ",
    dropoff: "BIRAKIŞ",

    flight: "Uçuş",
    vehicleType: "Araç Tipi",
    passenger: "Yolcu",
    luggage: "Bagaj",

    unspecified: "Belirtilmedi",
    standard: "Standart",

    person: "kişi",
    item: "adet",

    match: "Uyum",
    recommendedVehicle: "Önerilen araç",

    accepting: "İş Kilitleniyor...",
    acceptTransfer: "Transferi Kabul Et",

    acceptNote:
      "Kabul işlemi tamamlandığı anda transfer şirketinize kilitlenir ve diğer tedarikçilerin havuzundan kaldırılır.",

    noDate: "Tarih belirtilmedi",
    notRefreshed: "Henüz yenilenmedi",
    live: "Canlı",
    lastUpdated: "Son güncelleme",

    fullMatch: "Tam kapsama uyumu",
    partialMatch: "Operasyonel kapsama uyumu",
    manualReview: "Manuel kontrol gerekli",
    suitableOperation: "Uygun operasyon",

    jobsLoadFailed: "Açık işler yüklenemedi.",
    jobAlreadyAccepted:
      "Bu iş başka bir tedarikçi tarafından kabul edildi.",
    acceptanceFailed: "Transfer kabul edilemedi.",
    transfer: "Transfer",
    assignedToCompany: "şirketinize atandı.",
  },

  en: {
    market: "SKYFLEET JOB MARKET",
    title: "Open Jobs",
    intro:
      "View transfers that match your operating area and capacity. The first eligible supplier to accept gets the job.",

    livePool: "Live Pool",
    refreshPool: "Refresh Pool",
    refreshing: "Refreshing...",

    openJobs: "Open Jobs",
    availableNow: "Available for acceptance now",

    potentialEarnings: "Potential Earnings",
    visibleJobsTotal:
      "Total value of visible open jobs",

    assignmentModel: "Assignment Model",
    firstAccept: "First Accept",
    firstAcceptWins:
      "First eligible acceptance wins",

    jobAccepted: "Job accepted",
    goToTransfers: "Go to My Transfers",

    operationFailed:
      "Operation could not be completed",

    loadingJobs: "Loading open jobs...",
    noJobs: "No suitable open jobs right now",
    noJobsDetail:
      "New eligible transfers will automatically appear here. The pool refreshes every 15 seconds.",

    netEarnings: "NET EARNINGS",

    pickup: "PICKUP",
    dropoff: "DROP-OFF",

    flight: "Flight",
    vehicleType: "Vehicle Type",
    passenger: "Passenger",
    luggage: "Luggage",

    unspecified: "Not specified",
    standard: "Standard",

    person: "people",
    item: "items",

    match: "Match",
    recommendedVehicle: "Recommended vehicle",

    accepting: "Locking Job...",
    acceptTransfer: "Accept Transfer",

    acceptNote:
      "Once acceptance is completed, the transfer is locked to your company and removed from other suppliers' pools.",

    noDate: "Date not specified",
    notRefreshed: "Not refreshed yet",
    live: "Live",
    lastUpdated: "Last updated",

    fullMatch: "Full coverage match",
    partialMatch: "Operational coverage match",
    manualReview: "Manual review required",
    suitableOperation: "Suitable operation",

    jobsLoadFailed: "Open jobs could not be loaded.",
    jobAlreadyAccepted:
      "This job has already been accepted by another supplier.",
    acceptanceFailed:
      "Transfer could not be accepted.",
    transfer: "Transfer",
    assignedToCompany:
      "has been assigned to your company.",
  },

  es: {
    market: "MERCADO DE TRABAJOS SKYFLEET",
    title: "Trabajos disponibles",
    intro:
      "Consulte los traslados compatibles con su zona operativa y capacidad. El primer proveedor elegible que acepte obtiene el trabajo.",

    livePool: "Bolsa en vivo",
    refreshPool: "Actualizar bolsa",
    refreshing: "Actualizando...",

    openJobs: "Trabajos disponibles",
    availableNow: "Disponibles para aceptar ahora",

    potentialEarnings: "Ganancias potenciales",
    visibleJobsTotal:
      "Valor total de los trabajos visibles",

    assignmentModel: "Modelo de asignación",
    firstAccept: "Primera aceptación",
    firstAcceptWins:
      "La primera aceptación válida gana",

    jobAccepted: "Trabajo aceptado",
    goToTransfers: "Ir a Mis Traslados",

    operationFailed:
      "No se pudo completar la operación",

    loadingJobs:
      "Cargando trabajos disponibles...",
    noJobs:
      "No hay trabajos adecuados disponibles",
    noJobsDetail:
      "Los nuevos traslados compatibles aparecerán aquí automáticamente. La bolsa se actualiza cada 15 segundos.",

    netEarnings: "GANANCIA NETA",

    pickup: "RECOGIDA",
    dropoff: "DESTINO",

    flight: "Vuelo",
    vehicleType: "Tipo de vehículo",
    passenger: "Pasajero",
    luggage: "Equipaje",

    unspecified: "No especificado",
    standard: "Estándar",

    person: "personas",
    item: "unidades",

    match: "Compatibilidad",
    recommendedVehicle: "Vehículo recomendado",

    accepting: "Bloqueando trabajo...",
    acceptTransfer: "Aceptar traslado",

    acceptNote:
      "Una vez completada la aceptación, el traslado queda asignado a su empresa y se elimina de las bolsas de otros proveedores.",

    noDate: "Fecha no especificada",
    notRefreshed: "Aún no actualizado",
    live: "En vivo",
    lastUpdated: "Última actualización",

    fullMatch: "Cobertura completa",
    partialMatch: "Cobertura operativa",
    manualReview: "Revisión manual necesaria",
    suitableOperation: "Operación adecuada",

    jobsLoadFailed:
      "No se pudieron cargar los trabajos.",
    jobAlreadyAccepted:
      "Otro proveedor ya ha aceptado este trabajo.",
    acceptanceFailed:
      "No se pudo aceptar el traslado.",
    transfer: "Traslado",
    assignedToCompany:
      "ha sido asignado a su empresa.",
  },

  ar: {
    market: "سوق وظائف SKYFLEET",
    title: "الوظائف المتاحة",
    intro:
      "اعرض التحويلات المناسبة لمنطقة عملك وقدرتك التشغيلية. يحصل أول مورد مؤهل يقبل المهمة عليها.",

    livePool: "المجموعة المباشرة",
    refreshPool: "تحديث المجموعة",
    refreshing: "جارٍ التحديث...",

    openJobs: "الوظائف المتاحة",
    availableNow: "متاحة للقبول الآن",

    potentialEarnings: "المستحقات المحتملة",
    visibleJobsTotal:
      "إجمالي قيمة الوظائف الظاهرة",

    assignmentModel: "نموذج التعيين",
    firstAccept: "الأولوية لأول قبول",
    firstAcceptWins:
      "أول قبول مؤهل يفوز",

    jobAccepted: "تم قبول المهمة",
    goToTransfers: "الانتقال إلى تحويلاتي",

    operationFailed: "تعذر إكمال العملية",

    loadingJobs:
      "جارٍ تحميل الوظائف المتاحة...",
    noJobs:
      "لا توجد وظائف مناسبة متاحة حالياً",
    noJobsDetail:
      "ستظهر التحويلات المناسبة الجديدة هنا تلقائياً. يتم تحديث المجموعة كل 15 ثانية.",

    netEarnings: "صافي المستحقات",

    pickup: "الاستلام",
    dropoff: "التوصيل",

    flight: "الرحلة",
    vehicleType: "نوع المركبة",
    passenger: "الراكب",
    luggage: "الأمتعة",

    unspecified: "غير محدد",
    standard: "قياسي",

    person: "أشخاص",
    item: "قطع",

    match: "تطابق",
    recommendedVehicle: "المركبة المقترحة",

    accepting: "جارٍ حجز المهمة...",
    acceptTransfer: "قبول التحويل",

    acceptNote:
      "عند اكتمال القبول، يتم حجز التحويل لشركتك وإزالته من قوائم الموردين الآخرين.",

    noDate: "التاريخ غير محدد",
    notRefreshed: "لم يتم التحديث بعد",
    live: "مباشر",
    lastUpdated: "آخر تحديث",

    fullMatch: "تطابق تغطية كامل",
    partialMatch: "تطابق تغطية تشغيلية",
    manualReview: "يتطلب مراجعة يدوية",
    suitableOperation: "عملية مناسبة",

    jobsLoadFailed:
      "تعذر تحميل الوظائف المتاحة.",
    jobAlreadyAccepted:
      "تم قبول هذه المهمة بالفعل من مورد آخر.",
    acceptanceFailed:
      "تعذر قبول التحويل.",
    transfer: "تحويل",
    assignedToCompany:
      "تم تعيينه لشركتك.",
  },
};

function getText(language) {
  return TEXT[language] || TEXT.en;
}

function getLocale(language) {
  return LOCALES[language] || LOCALES.en;
}

export default function SupplierAvailableJobsPage({
  onOpenMyTransfers,
}) {
  const { language } = useLanguage();

  const t = useMemo(
    () => getText(language),
    [language],
  );

  const locale = getLocale(language);

  const [jobs, setJobs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [
    acceptingId,
    setAcceptingId,
  ] = useState(null);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [
    generatedAt,
    setGeneratedAt,
  ] = useState(null);

  const loadJobs = useCallback(
    async ({
      silent = false,
    } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const result =
          await getAvailableJobs(
            100,
          );

        setJobs(
          result.jobs || [],
        );

        setGeneratedAt(
          result.meta
            ?.generated_at ||
            new Date()
              .toISOString(),
        );
      } catch (
        requestError
      ) {
        setError(
          requestError
            ?.response?.data
            ?.message ||
            requestError
              ?.message ||
            t.jobsLoadFailed,
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t],
  );

  useEffect(() => {
    loadJobs();

    const timer =
      window.setInterval(
        () => {
          loadJobs({
            silent: true,
          });
        },
        15000,
      );

    return () =>
      window.clearInterval(
        timer,
      );
  }, [loadJobs]);

  async function handleAccept(
    job,
  ) {
    if (
      !job?.id ||
      acceptingId
    ) {
      return;
    }

    setAcceptingId(job.id);
    setError("");
    setMessage("");

    try {
      const response =
        await acceptAvailableJob(
          job.id,
        );

      setJobs(
        (currentJobs) =>
          currentJobs.filter(
            (item) =>
              Number(
                item.id,
              ) !==
              Number(
                job.id,
              ),
          ),
      );

      const reference =
        job.booking_reference ||
        t.transfer;

      setMessage(
        response?.message ||
          `${reference} ${t.assignedToCompany}`,
      );
    } catch (
      requestError
    ) {
      const status =
        requestError
          ?.response?.status;

      const responseMessage =
        requestError
          ?.response?.data
          ?.message;

      if (status === 409) {
        setJobs(
          (currentJobs) =>
            currentJobs.filter(
              (item) =>
                Number(
                  item.id,
                ) !==
                Number(
                  job.id,
                ),
            ),
        );

        setError(
          responseMessage ||
            t.jobAlreadyAccepted,
        );

        loadJobs({
          silent: true,
        });
      } else {
        setError(
          responseMessage ||
            requestError
              ?.message ||
            t.acceptanceFailed,
        );
      }
    } finally {
      setAcceptingId(
        null,
      );
    }
  }

  const totalPotential =
    useMemo(() => {
      return jobs.reduce(
        (sum, job) => {
          const amount =
            Number(
              job
                ?.supplier_amount,
            );

          return Number.isFinite(
            amount,
          )
            ? sum + amount
            : sum;
        },
        0,
      );
    }, [jobs]);

  const currency =
    jobs[0]?.currency ||
    "EUR";

  return (
    <main className="supplier-job-pool-page">
      <header className="supplier-job-pool-hero">
        <div>
          <span className="supplier-job-pool-eyebrow">
            {t.market}
          </span>

          <h1>
            {t.title}
          </h1>

          <p>
            {t.intro}
          </p>
        </div>

        <div className="supplier-job-pool-actions">
          <div className="supplier-job-pool-live">
            <span />

            <div>
              <strong>
                {t.livePool}
              </strong>

              <small>
                {formatGeneratedAt(
                  generatedAt,
                  locale,
                  t,
                )}
              </small>
            </div>
          </div>

          <button
            type="button"
            className="supplier-job-pool-refresh"
            disabled={
              refreshing ||
              loading
            }
            onClick={() =>
              loadJobs({
                silent: true,
              })
            }
          >
            {refreshing
              ? t.refreshing
              : t.refreshPool}
          </button>
        </div>
      </header>

      <section className="supplier-job-pool-summary">
        <SummaryCard
          label={
            t.openJobs
          }
          value={jobs.length}
          detail={
            t.availableNow
          }
        />

        <SummaryCard
          label={
            t.potentialEarnings
          }
          value={`${formatMoney(
            totalPotential,
            locale,
          )} ${currency}`}
          detail={
            t.visibleJobsTotal
          }
        />

        <SummaryCard
          label={
            t.assignmentModel
          }
          value={
            t.firstAccept
          }
          detail={
            t.firstAcceptWins
          }
        />
      </section>

      {message && (
        <div className="supplier-job-pool-message success">
          <div>
            <strong>
              {t.jobAccepted}
            </strong>

            <span>
              {message}
            </span>
          </div>

          <button
            type="button"
            onClick={
              onOpenMyTransfers
            }
          >
            {t.goToTransfers}
          </button>
        </div>
      )}

      {error && (
        <div className="supplier-job-pool-message error">
          <div>
            <strong>
              {t.operationFailed}
            </strong>

            <span>
              {error}
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="supplier-job-pool-state">
          {t.loadingJobs}
        </div>
      ) : jobs.length ===
        0 ? (
        <div className="supplier-job-pool-empty">
          <div className="supplier-job-pool-empty-icon">
            ✓
          </div>

          <h2>
            {t.noJobs}
          </h2>

          <p>
            {
              t.noJobsDetail
            }
          </p>
        </div>
      ) : (
        <section className="supplier-job-pool-grid">
          {jobs.map(
            (job) => (
              <JobCard
                key={job.id}
                job={job}
                accepting={
                  acceptingId ===
                  job.id
                }
                disabled={Boolean(
                  acceptingId,
                )}
                onAccept={() =>
                  handleAccept(
                    job,
                  )
                }
                language={
                  language
                }
                locale={
                  locale
                }
                t={t}
              />
            ),
          )}
        </section>
      )}
    </main>
  );
}

function JobCard({
  job,
  accepting,
  disabled,
  onAccept,
  language,
  locale,
  t,
}) {
  const match =
    job?.match || {};

  const passengers =
    Number(
      job?.adult || 0,
    ) +
    Number(
      job?.child || 0,
    ) +
    Number(
      job?.baby || 0,
    );

  const bestVehicle =
    match?.best_vehicle;

  return (
    <article className="supplier-job-card">
      <div className="supplier-job-card-topline">
        <div>
          <span className="supplier-job-reference">
            {job.booking_reference ||
              `TRANSFER #${job.id}`}
          </span>

          <h2>
            {formatDateTime(
              job.pickup_time,
              locale,
              t,
            )}
          </h2>
        </div>

        <div className="supplier-job-payout">
          <small>
            {t.netEarnings}
          </small>

          <strong>
            {formatMoney(
              job.supplier_amount,
              locale,
            )}{" "}
            {job.currency ||
              "EUR"}
          </strong>
        </div>
      </div>

      <div className="supplier-job-route">
        <RoutePoint
          tone="pickup"
          label={t.pickup}
          value={
            job.pickup
          }
          fallback={
            t.unspecified
          }
        />

        <div className="supplier-job-route-line" />

        <RoutePoint
          tone="dropoff"
          label={t.dropoff}
          value={
            job.dropoff
          }
          fallback={
            t.unspecified
          }
        />
      </div>

      <div className="supplier-job-meta-grid">
        <Meta
          label={t.flight}
          value={
            job.flight_number ||
            t.unspecified
          }
        />

        <Meta
          label={
            t.vehicleType
          }
          value={
            job.vehicle_type ||
            t.standard
          }
        />

        <Meta
          label={
            t.passenger
          }
          value={formatCount(
            Math.max(
              passengers,
              1,
            ),
            "person",
            language,
            t,
          )}
        />

        <Meta
          label={t.luggage}
          value={formatCount(
            Number(
              job.luggage_count ||
                0,
            ),
            "item",
            language,
            t,
          )}
        />
      </div>

      <div className="supplier-job-match-row">
        <div>
          <span className="supplier-job-score">
            %
            {match.score ??
              "—"}{" "}
            {t.match}
          </span>

          <small>
            {formatMatchLevel(
              match.match_level,
              t,
            )}
          </small>
        </div>

        {bestVehicle && (
          <div className="supplier-job-best-vehicle">
            <span>
              {
                t.recommendedVehicle
              }
            </span>

            <strong>
              {
                bestVehicle.brand
              }{" "}
              {
                bestVehicle.model
              }
            </strong>

            <small>
              {
                bestVehicle.plate
              }
            </small>
          </div>
        )}
      </div>

      <button
        type="button"
        className="supplier-job-accept-button"
        disabled={disabled}
        onClick={onAccept}
      >
        {accepting
          ? t.accepting
          : t.acceptTransfer}
      </button>

      <p className="supplier-job-first-accept-note">
        {t.acceptNote}
      </p>
    </article>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}) {
  return (
    <article className="supplier-job-summary-card">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

      <small>
        {detail}
      </small>
    </article>
  );
}

function RoutePoint({
  tone,
  label,
  value,
  fallback,
}) {
  return (
    <div
      className={`supplier-job-route-point ${tone}`}
    >
      <span>
        {label}
      </span>

      <strong>
        {value ||
          fallback}
      </strong>
    </div>
  );
}

function Meta({
  label,
  value,
}) {
  return (
    <div className="supplier-job-meta">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function formatDateTime(
  value,
  locale,
  t,
) {
  if (!value) {
    return t.noDate;
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
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function formatGeneratedAt(
  value,
  locale,
  t,
) {
  if (!value) {
    return t.notRefreshed;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return t.live;
  }

  const time =
    date.toLocaleTimeString(
      locale,
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      },
    );

  return `${t.lastUpdated} ${time}`;
}

function formatMoney(
  value,
  locale,
) {
  const amount =
    Number(value);

  if (
    !Number.isFinite(
      amount,
    )
  ) {
    return new Intl.NumberFormat(
      locale,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    ).format(0);
  }

  return new Intl.NumberFormat(
    locale,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(amount);
}

function formatCount(
  value,
  type,
  language,
  t,
) {
  const count =
    Number(value) || 0;

  if (language === "en") {
    if (
      type === "person"
    ) {
      return `${count} ${
        count === 1
          ? "person"
          : "people"
      }`;
    }

    return `${count} ${
      count === 1
        ? "item"
        : "items"
    }`;
  }

  if (language === "es") {
    if (
      type === "person"
    ) {
      return `${count} ${
        count === 1
          ? "persona"
          : "personas"
      }`;
    }

    return `${count} ${
      count === 1
        ? "unidad"
        : "unidades"
    }`;
  }

  if (language === "ar") {
    return `${count} ${
      type === "person"
        ? t.person
        : t.item
    }`;
  }

  return `${count} ${
    type === "person"
      ? t.person
      : t.item
  }`;
}

function formatMatchLevel(
  level,
  t,
) {
  const labels = {
    full: t.fullMatch,
    partial:
      t.partialMatch,
    review:
      t.manualReview,
  };

  return (
    labels[level] ||
    t.suitableOperation
  );
}
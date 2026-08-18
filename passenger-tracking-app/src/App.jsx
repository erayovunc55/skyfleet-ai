import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { getPublicTracking } from "./api";

const STATUS_LABELS = {
  accepted: "Sürücü Hazırlanıyor",
  on_the_way: "Sürücü Yolda",
  arrived: "Sürücü Alış Noktasında",
  passenger_called: "Sürücü Sizi Aradı",
  passenger_on_board: "Yolcu Araçta",
  trip_started: "Yolculuk Başladı",
  completed: "Transfer Tamamlandı",
  no_show: "Operasyon Sonlandırıldı",
  cancelled: "Transfer İptal Edildi",
};

const ACTIVE_STATUSES = new Set([
  "on_the_way",
  "arrived",
  "passenger_called",
  "passenger_on_board",
  "trip_started",
]);

const ROAD_ROUTING_ENDPOINTS = [
  "https://router.project-osrm.org/route/v1/driving",
  "https://routing.openstreetmap.de/routed-car/route/v1/driving",
];

const carIcon = L.divIcon({
  className: "tracking-map-marker-wrap",
  html: '<div class="tracking-map-marker car">🚘</div>',
  iconSize: [46, 46],
  iconAnchor: [23, 23],
});

const pickupIcon = L.divIcon({
  className: "tracking-map-marker-wrap",
  html: '<div class="tracking-map-marker pickup">P</div>',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

const dropoffIcon = L.divIcon({
  className: "tracking-map-marker-wrap",
  html: '<div class="tracking-map-marker dropoff">D</div>',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

export default function App() {
  const token = useMemo(getTrackingToken, []);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);

  const loadTracking = useCallback(
    async (silent = false) => {
      if (!token) {
        setError("Geçerli bir takip bağlantısı bulunamadı.");
        setLoading(false);
        return;
      }

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const data = await getPublicTracking(token);
        setTracking(data);
        setUpdatedAt(new Date());
        setError("");
      } catch (requestError) {
        setError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            "Takip bilgileri alınamadı.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    loadTracking();
  }, [loadTracking]);

  useEffect(() => {
    if (!tracking?.tracking?.active) {
      return undefined;
    }

    const seconds = Math.max(
      5,
      Number(tracking.tracking.refresh_after_seconds) || 5,
    );

    const timer = window.setInterval(
      () => loadTracking(true),
      seconds * 1000,
    );

    return () => window.clearInterval(timer);
  }, [loadTracking, tracking?.tracking?.active, tracking?.tracking?.refresh_after_seconds]);

  if (loading && !tracking) {
    return <LoadingScreen />;
  }

  if (error && !tracking) {
    return <ErrorScreen message={error} onRetry={loadTracking} />;
  }

  return (
    <main className="tracking-page">
      <header className="tracking-topbar">
        <Brand />

        <div className="tracking-live-state">
          <span className={tracking?.tracking?.active ? "pulse" : ""} />
          {tracking?.tracking?.active
            ? "Canlı Takip Aktif"
            : "Takip Tamamlandı"}
        </div>
      </header>

      <section className="tracking-hero">
        <div>
          <span className="eyebrow">TRANSFER DURUMU</span>
          <h1>{getStatusLabel(tracking?.status)}</h1>
          <p>
            Rezervasyonunuz güvenli şekilde takip ediliyor.
          </p>
        </div>

        <div className="tracking-reference">
          <span>SF REZERVASYON</span>
          <strong>{tracking?.booking_reference || "—"}</strong>
        </div>
      </section>

      <section className="tracking-layout">
        <div className="tracking-map-card">
          <TrackingMap tracking={tracking} />

          <div className="tracking-map-footer">
            <div>
              <span className="tracking-signal" />
              <span>
                {getLocationState(tracking?.location)}
              </span>
            </div>

            <button
              type="button"
              disabled={refreshing}
              onClick={() => loadTracking(true)}
            >
              {refreshing ? "Güncelleniyor..." : "Konumu Yenile"}
            </button>
          </div>
        </div>

        <aside className="tracking-sidebar">
          <StatusTimeline status={tracking?.status} />
          <DriverVehicleCard tracking={tracking} />
        </aside>
      </section>

      <section className="tracking-route-card">
        <RoutePoint
          type="pickup"
          label="ALIŞ NOKTASI"
          address={tracking?.pickup?.address}
          note={tracking?.pickup?.meet_point}
        />

        <div className="tracking-route-line" />

        <RoutePoint
          type="dropoff"
          label="BIRAKIŞ NOKTASI"
          address={tracking?.dropoff?.address}
        />
      </section>

      <section className="tracking-summary-grid">
        <SummaryItem
          label="Alış Zamanı"
          value={formatPickupTime(tracking?.pickup_time)}
        />
        <SummaryItem
          label="Uçuş Numarası"
          value={tracking?.flight_number || "Belirtilmedi"}
        />
        <SummaryItem
          label="Son Konum"
          value={formatLastSeen(tracking?.location?.recorded_at)}
        />
      </section>

      {error && (
        <div className="tracking-inline-warning">
          Son güncelleme alınamadı. Mevcut konum gösteriliyor.
        </div>
      )}

      <footer className="tracking-footer">
        <Brand compact />
        <p>
          Son güncelleme: {formatClock(updatedAt)} · Güvenli yolcu bağlantısı
        </p>
      </footer>
    </main>
  );
}

function TrackingMap({ tracking }) {
  const [roadRoute, setRoadRoute] =
    useState([]);

  const points = useMemo(() => {
    const candidates = [
      toPosition(tracking?.location),
      toPosition(tracking?.pickup),
      toPosition(tracking?.dropoff),
    ];

    return candidates.filter(Boolean);
  }, [tracking]);

  const routeEndpoints = useMemo(
    () => [
      toPosition(tracking?.pickup),
      toPosition(tracking?.dropoff),
    ].filter(Boolean),
    [
      tracking?.pickup?.latitude,
      tracking?.pickup?.longitude,
      tracking?.dropoff?.latitude,
      tracking?.dropoff?.longitude,
    ],
  );

  const routeKey = routeEndpoints
    .map((point) => point.join(","))
    .join(";");

  useEffect(() => {
    const controller = new AbortController();

    if (routeEndpoints.length !== 2) {
      setRoadRoute([]);
      return () => controller.abort();
    }

    setRoadRoute([]);

    loadRoadRoute(
      routeEndpoints,
      controller.signal,
    )
      .then((route) => {
        if (!controller.signal.aborted) {
          setRoadRoute(route);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setRoadRoute([]);
        }
      });

    return () => controller.abort();
  }, [routeKey]);

  const center = points[0] || [41.0082, 28.9784];

  const fitPoints =
    roadRoute.length > 1
      ? [...points, ...roadRoute]
      : points;

  return (
    <MapContainer
      className="tracking-map"
      center={center}
      zoom={12}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {toPosition(tracking?.location) && (
        <Marker
          position={toPosition(tracking.location)}
          icon={carIcon}
        />
      )}

      {toPosition(tracking?.pickup) && (
        <Marker
          position={toPosition(tracking.pickup)}
          icon={pickupIcon}
        />
      )}

      {toPosition(tracking?.dropoff) && (
        <Marker
          position={toPosition(tracking.dropoff)}
          icon={dropoffIcon}
        />
      )}

      {roadRoute.length > 1 && (
        <Polyline
          positions={roadRoute}
          pathOptions={{
            color: "#2bbcff",
            weight: 5,
            opacity: 0.9,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      )}

      <FitMap points={fitPoints} />
    </MapContainer>
  );
}

async function loadRoadRoute(
  endpoints,
  signal,
) {
  const coordinates = endpoints
    .map(
      ([latitude, longitude]) =>
        `${longitude},${latitude}`,
    )
    .join(";");

  let lastError = null;

  for (const endpoint of ROAD_ROUTING_ENDPOINTS) {
    try {
      const response = await fetch(
        `${endpoint}/${coordinates}` +
          "?overview=full&geometries=geojson&steps=false",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          signal,
        },
      );

      if (!response.ok) {
        throw new Error(
          `Rota servisi ${response.status} hatası döndürdü.`,
        );
      }

      const payload = await response.json();
      const coordinatesList =
        payload?.routes?.[0]?.geometry
          ?.coordinates;

      if (
        !Array.isArray(coordinatesList) ||
        coordinatesList.length < 2
      ) {
        throw new Error(
          "Rota geometrisi bulunamadı.",
        );
      }

      return coordinatesList.map(
        ([longitude, latitude]) => [
          latitude,
          longitude,
        ],
      );
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError || new Error(
    "Yol güzergâhı alınamadı.",
  );
}

function FitMap({ points }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 1) {
      map.setView(points[0], 14, { animate: true });
    } else if (points.length > 1) {
      map.fitBounds(points, {
        padding: [42, 42],
        maxZoom: 14,
        animate: true,
      });
    }
  }, [map, points]);

  return null;
}

function StatusTimeline({ status }) {
  const steps = [
    { key: "on_the_way", label: "Sürücü yola çıktı" },
    { key: "arrived", label: "Alış noktasına ulaştı" },
    { key: "passenger_on_board", label: "Yolcu araçta" },
    { key: "completed", label: "Transfer tamamlandı" },
  ];

  const rank = {
    accepted: -1,
    on_the_way: 0,
    arrived: 1,
    passenger_called: 1,
    passenger_on_board: 2,
    trip_started: 2,
    completed: 3,
    no_show: 1,
    cancelled: -1,
  }[status] ?? -1;

  return (
    <article className="tracking-info-card">
      <span className="eyebrow">CANLI OPERASYON</span>
      <h2>Yolculuk Akışı</h2>

      <div className="tracking-timeline">
        {steps.map((step, index) => (
          <div
            key={step.key}
            className={
              index < rank
                ? "complete"
                : index === rank
                  ? "current"
                  : ""
            }
          >
            <span>{index < rank ? "✓" : index + 1}</span>
            <strong>{step.label}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function DriverVehicleCard({ tracking }) {
  const vehicle = tracking?.vehicle;

  return (
    <article className="tracking-info-card">
      <span className="eyebrow">SİZİN İÇİN YOLDA</span>
      <h2>Sürücü ve Araç</h2>

      <div className="tracking-driver">
        <div className="tracking-avatar">
          {getInitials(tracking?.driver?.name)}
        </div>
        <div>
          <span>SÜRÜCÜ</span>
          <strong>{tracking?.driver?.name || "Atanıyor"}</strong>
        </div>
      </div>

      <dl className="tracking-vehicle-grid">
        <div>
          <dt>Plaka</dt>
          <dd>{vehicle?.plate || "—"}</dd>
        </div>
        <div>
          <dt>Araç</dt>
          <dd>{formatVehicle(vehicle)}</dd>
        </div>
        <div>
          <dt>Renk</dt>
          <dd>{vehicle?.color || "Belirtilmedi"}</dd>
        </div>
        <div>
          <dt>Tip</dt>
          <dd>{vehicle?.vehicle_type || "Belirtilmedi"}</dd>
        </div>
      </dl>
    </article>
  );
}

function RoutePoint({ type, label, address, note }) {
  return (
    <div className="tracking-route-point">
      <span className={`tracking-route-icon ${type}`}>
        {type === "pickup" ? "P" : "D"}
      </span>
      <div>
        <span>{label}</span>
        <strong>{address || "Adres belirtilmedi"}</strong>
        {note && <small>Buluşma: {note}</small>}
      </div>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Brand({ compact = false }) {
  return (
    <div className={compact ? "tracking-brand compact" : "tracking-brand"}>
      <span>SF</span>
      <div>
        <strong>SKYFLEET AI</strong>
        {!compact && <small>LIVE JOURNEY</small>}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="tracking-state-screen">
      <Brand />
      <div className="tracking-loader" />
      <h1>Transferiniz hazırlanıyor</h1>
      <p>Canlı yolculuk bilgileri güvenli şekilde yükleniyor.</p>
    </main>
  );
}

function ErrorScreen({ message, onRetry }) {
  return (
    <main className="tracking-state-screen error">
      <Brand />
      <div className="tracking-error-icon">!</div>
      <h1>Takip bağlantısı açılamadı</h1>
      <p>{message}</p>
      <button type="button" onClick={() => onRetry()}>
        Tekrar Dene
      </button>
    </main>
  );
}

function getTrackingToken() {
  const segments = window.location.pathname
    .split("/")
    .filter(Boolean);
  const trackIndex = segments.indexOf("track");
  return trackIndex >= 0 ? segments[trackIndex + 1] || "" : "";
}

function toPosition(value) {
  const latitude = Number(value?.latitude);
  const longitude = Number(value?.longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    ? [latitude, longitude]
    : null;
}

function getStatusLabel(status) {
  return STATUS_LABELS[status] || "Transfer Takibi";
}

function getLocationState(location) {
  if (!location) {
    return "Sürücü konumu bekleniyor";
  }
  return `Konum ${formatLastSeen(location.recorded_at).toLowerCase()} güncellendi`;
}

function formatPickupTime(value) {
  if (!value) return "Belirtilmedi";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Belirtilmedi";
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLastSeen(value) {
  if (!value) return "Henüz alınmadı";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Henüz alınmadı";
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 15) return "Şimdi";
  if (seconds < 60) return `${seconds} saniye önce`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} dakika önce`;
  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatClock(value) {
  if (!value) return "—";
  return value.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getInitials(name) {
  if (!name) return "SF";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatVehicle(vehicle) {
  const value = [vehicle?.brand, vehicle?.model]
    .filter(Boolean)
    .join(" ");
  return value || "Belirtilmedi";
}

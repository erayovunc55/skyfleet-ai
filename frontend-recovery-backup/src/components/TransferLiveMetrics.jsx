import { useMemo } from "react";

const DEFAULT_SPEED_KMH = 35;

export default function TransferLiveMetrics({
  transfer,
}) {
  const metrics = useMemo(
    () => calculateMetrics(transfer),
    [transfer],
  );

  if (!transfer?.latest_location) {
    return (
      <section className="live-metrics">
        <div className="live-metrics-empty">
          Sürücüden henüz canlı GPS verisi gelmedi.
        </div>
      </section>
    );
  }

  return (
    <section className="live-metrics">
      <article className="live-metric-card">
        <span>Hedef</span>

        <strong>{metrics.targetLabel}</strong>

        <small>
          {metrics.targetAddress ||
            "Adres belirtilmedi"}
        </small>
      </article>

      <article className="live-metric-card">
        <span>Kalan Mesafe</span>

        <strong>
          {formatDistance(metrics.distanceKm)}
        </strong>

        <small>Yaklaşık kuş uçuşu mesafe</small>
      </article>

      <article className="live-metric-card">
        <span>Tahmini Varış</span>

        <strong>
          {formatDuration(metrics.etaMinutes)}
        </strong>

        <small>
          {metrics.hasRealSpeed
            ? "GPS hızına göre"
            : `${DEFAULT_SPEED_KMH} km/sa varsayımı`}
        </small>
      </article>

      <article className="live-metric-card">
        <span>Anlık Hız</span>

        <strong>
          {metrics.hasRealSpeed
            ? `${Math.round(
                metrics.speedKmh,
              )} km/sa`
            : "Bilinmiyor"}
        </strong>

        <small>
          {metrics.hasRealSpeed
            ? "Sürücü GPS verisi"
            : "Cihaz hız göndermedi"}
        </small>
      </article>

      <article className="live-metric-card">
        <span>GPS Hassasiyeti</span>

        <strong>
          {formatAccuracy(metrics.accuracy)}
        </strong>

        <small>
          {getAccuracyLabel(metrics.accuracy)}
        </small>
      </article>

      <article className="live-metric-card">
        <span>Son Konum</span>

        <strong>
          {formatLocationTime(
            metrics.recordedAt,
          )}
        </strong>

        <small>
          {formatTimeAgo(metrics.recordedAt)}
        </small>
      </article>
    </section>
  );
}

function calculateMetrics(transfer) {
  const location = transfer?.latest_location;

  const driverPosition = getCoordinatePair(
    location?.latitude,
    location?.longitude,
  );

const normalizedStatus = String(
  transfer?.status || "",
)
  .trim()
  .toLowerCase();

const destinationIsDropoff = [
  "passenger_on_board",
  "trip_started",
  "completed",
].includes(normalizedStatus);

console.log(
  "ETA hedef kontrolü:",
  normalizedStatus,
  destinationIsDropoff,
);

  const targetPosition = destinationIsDropoff
    ? getCoordinatePair(
        transfer?.dropoff_lat,
        transfer?.dropoff_lng,
      )
    : getCoordinatePair(
        transfer?.pickup_lat,
        transfer?.pickup_lng,
      );

  const targetLabel = destinationIsDropoff
    ? "Bırakış Noktası"
    : "Alış Noktası";

  const targetAddress = destinationIsDropoff
    ? transfer?.dropoff
    : transfer?.pickup;

  const distanceKm =
    driverPosition && targetPosition
      ? calculateDistanceKm(
          driverPosition,
          targetPosition,
        )
      : null;

  const rawSpeed = Number(location?.speed);

  /*
   * Geolocation API hız değerini metre/saniye
   * olarak verir. Burada km/sa değerine çevrilir.
   */
  const hasRealSpeed =
    Number.isFinite(rawSpeed) && rawSpeed > 0;

  const speedKmh = hasRealSpeed
    ? rawSpeed * 3.6
    : DEFAULT_SPEED_KMH;

  const etaMinutes =
    Number.isFinite(distanceKm) && speedKmh > 0
      ? (distanceKm / speedKmh) * 60
      : null;

  return {
    targetLabel,
    targetAddress,
    distanceKm,
    etaMinutes,
    speedKmh,
    hasRealSpeed,
    accuracy: Number(location?.accuracy),
    recordedAt: location?.recorded_at,
  };
}

function getCoordinatePair(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return null;
  }

  return [lat, lng];
}

function calculateDistanceKm(
  [lat1, lng1],
  [lat2, lng2],
) {
  const earthRadiusKm = 6371;

  const latitudeDifference = toRadians(
    lat2 - lat1,
  );

  const longitudeDifference = toRadians(
    lng2 - lng1,
  );

  const firstLatitude = toRadians(lat1);
  const secondLatitude = toRadians(lat2);

  const calculation =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  const centralAngle =
    2 *
    Math.atan2(
      Math.sqrt(calculation),
      Math.sqrt(1 - calculation),
    );

  return earthRadiusKm * centralAngle;
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function formatDistance(distanceKm) {
  if (!Number.isFinite(distanceKm)) {
    return "Bilinmiyor";
  }

  if (distanceKm < 1) {
    return `${Math.round(
      distanceKm * 1000,
    )} metre`;
  }

  return `${distanceKm.toFixed(1)} km`;
}

function formatDuration(minutes) {
  if (!Number.isFinite(minutes)) {
    return "Bilinmiyor";
  }

  const roundedMinutes = Math.max(
    1,
    Math.round(minutes),
  );

  if (roundedMinutes < 60) {
    return `${roundedMinutes} dk`;
  }

  const hours = Math.floor(
    roundedMinutes / 60,
  );

  const remainingMinutes =
    roundedMinutes % 60;

  return remainingMinutes > 0
    ? `${hours} sa ${remainingMinutes} dk`
    : `${hours} saat`;
}

function formatAccuracy(accuracy) {
  if (!Number.isFinite(accuracy)) {
    return "Bilinmiyor";
  }

  return `${Math.round(accuracy)} metre`;
}

function getAccuracyLabel(accuracy) {
  if (!Number.isFinite(accuracy)) {
    return "Hassasiyet bilgisi yok";
  }

  if (accuracy <= 15) {
    return "Çok iyi";
  }

  if (accuracy <= 50) {
    return "İyi";
  }

  if (accuracy <= 100) {
    return "Orta";
  }

  return "Düşük hassasiyet";
}

function formatLocationTime(value) {
  if (!value) {
    return "--:--:--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--:--:--";
  }

  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatTimeAgo(value) {
  if (!value) {
    return "Zaman bilgisi yok";
  }

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return "Zaman bilgisi yok";
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor(
      (Date.now() - timestamp) / 1000,
    ),
  );

  if (elapsedSeconds < 10) {
    return "Şimdi güncellendi";
  }

  if (elapsedSeconds < 60) {
    return `${elapsedSeconds} saniye önce`;
  }

  const minutes = Math.floor(
    elapsedSeconds / 60,
  );

  if (minutes < 60) {
    return `${minutes} dakika önce`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} saat önce`;
  }

  const days = Math.floor(hours / 24);

  return `${days} gün önce`;
}
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import L from "leaflet";

import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import useTransfer from "../hooks/useTransfer";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = [41.0082, 28.9784];

const ROAD_ROUTING_ENDPOINTS = [
  "https://router.project-osrm.org/route/v1/driving",
  "https://routing.openstreetmap.de/routed-car/route/v1/driving",
];

export default function LiveOperationMap() {
  const { selectedTransfer } = useTransfer();

  const [roadRoute, setRoadRoute] =
    useState([]);

  const [routeState, setRouteState] =
    useState("idle");

  const pickup = useMemo(
    () =>
      getCoordinate(
        selectedTransfer?.pickup_location?.latitude ??
          selectedTransfer?.pickup_lat,
        selectedTransfer?.pickup_location?.longitude ??
          selectedTransfer?.pickup_lng,
      ),
    [selectedTransfer],
  );

  const dropoff = useMemo(
    () =>
      getCoordinate(
        selectedTransfer?.dropoff_location?.latitude ??
          selectedTransfer?.dropoff_lat,
        selectedTransfer?.dropoff_location?.longitude ??
          selectedTransfer?.dropoff_lng,
      ),
    [selectedTransfer],
  );

  const driver = useMemo(
    () =>
      getCoordinate(
        selectedTransfer?.latest_location?.latitude,
        selectedTransfer?.latest_location?.longitude,
      ),
    [selectedTransfer],
  );

  const availablePoints = [
    pickup,
    dropoff,
    driver,
  ].filter(Boolean);

  const routeWaypoints = useMemo(
    () =>
      getRouteWaypoints({
        status: selectedTransfer?.status,
        driver,
        pickup,
        dropoff,
      }),
    [
      selectedTransfer?.status,
      driver,
      pickup,
      dropoff,
    ],
  );

  const routeKey = routeWaypoints
    .map(([latitude, longitude]) =>
      `${latitude.toFixed(5)},${longitude.toFixed(5)}`,
    )
    .join(";");

  useEffect(() => {
    const controller = new AbortController();

    if (routeWaypoints.length < 2) {
      setRoadRoute([]);
      setRouteState("idle");

      return () => controller.abort();
    }

    setRoadRoute([]);
    setRouteState("loading");

    loadRoadRoute(
      routeWaypoints,
      controller.signal,
    )
      .then((route) => {
        if (!controller.signal.aborted) {
          setRoadRoute(route);
          setRouteState("ready");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setRoadRoute([]);
          setRouteState("error");
        }
      });

    return () => controller.abort();
  }, [routeKey]);

  const fitPoints =
    roadRoute.length > 1
      ? [...availablePoints, ...roadRoute]
      : availablePoints;

  const center =
    driver ||
    pickup ||
    dropoff ||
    DEFAULT_CENTER;

  return (
    <div className="live-operation-map">
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom
        className="live-operation-map-container"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitMapBounds points={fitPoints} />

        {pickup && (
          <Marker position={pickup}>
            <Popup>
              <strong>Pickup</strong>
              <br />
              {getPickupLabel(selectedTransfer)}
            </Popup>
          </Marker>
        )}

        {dropoff && (
          <Marker position={dropoff}>
            <Popup>
              <strong>Dropoff</strong>
              <br />
              {getDropoffLabel(selectedTransfer)}
            </Popup>
          </Marker>
        )}

        {driver && (
          <Marker position={driver}>
            <Popup>
              <strong>Sürücü</strong>
              <br />
              {selectedTransfer?.driver?.name ||
                "Sürücü"}
              <br />
              Son GPS:{" "}
              {formatDateTime(
                selectedTransfer?.latest_location
                  ?.recorded_at,
              )}
            </Popup>
          </Marker>
        )}

        {roadRoute.length >= 2 && (
          <Polyline
            positions={roadRoute}
            pathOptions={{
              color: "#24b8ff",
              weight: 5,
              opacity: 0.9,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}
      </MapContainer>

      <MapMetrics
        transfer={selectedTransfer}
        driver={driver}
        routeState={routeState}
      />
    </div>
  );
}

function FitMapBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!Array.isArray(points) || points.length === 0) {
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }

    map.fitBounds(points, {
      padding: [40, 40],
      maxZoom: 14,
    });
  }, [map, points]);

  return null;
}

function MapMetrics({
  transfer,
  driver,
  routeState,
}) {
  const latestLocation =
    transfer?.latest_location;

  const gpsHealth =
    getGpsHealth(latestLocation);

  return (
    <>
      <div
        className={`live-gps-health live-gps-health-${gpsHealth.tone}`}
      >
        <span className="live-gps-health-dot" />

        <div>
          <strong>{gpsHealth.label}</strong>
          <small>{gpsHealth.description}</small>
        </div>
      </div>

      <div className="live-map-metrics">
        <Metric
          label="GPS Durumu"
          value={
            driver
              ? "Konum alındı"
              : "Konum bekleniyor"
          }
        />

        <Metric
          label="Son Güncelleme"
          value={formatDateTime(
            getLocationTimestamp(
              latestLocation,
            ),
          )}
        />

        <Metric
          label="Hassasiyet"
          value={
            latestLocation?.accuracy
              ? `${Math.round(
                  Number(
                    latestLocation.accuracy,
                  ),
                )} metre`
              : "Bilinmiyor"
          }
        />

        <Metric
          label="Hız"
          value={
            isValidNumber(
              latestLocation?.speed,
            )
              ? `${Number(
                  latestLocation.speed,
                ).toFixed(1)} km/sa`
              : "Bilinmiyor"
          }
        />

        <Metric
          label="Yol Rotası"
          value={getRouteStateLabel(
            routeState,
          )}
        />
      </div>
    </>
  );
}

function getGpsHealth(
  latestLocation,
) {
  if (!latestLocation) {
    return {
      tone: "offline",
      label: "GPS verisi bekleniyor",
      description:
        "Sürücü henüz konum göndermedi.",
    };
  }

  const timestamp =
    getLocationTimestamp(
      latestLocation,
    );

  if (!timestamp) {
    return {
      tone: "warning",
      label: "GPS zamanı bilinmiyor",
      description:
        "Konum mevcut ancak kayıt zamanı bulunamadı.",
    };
  }

  const ageSeconds = Math.max(
    0,
    Math.floor(
      (Date.now() -
        new Date(timestamp).getTime()) /
        1000,
    ),
  );

  if (ageSeconds <= 20) {
    return {
      tone: "online",
      label: "Sürücü canlı",
      description: `Son GPS ${ageSeconds} saniye önce alındı.`,
    };
  }

  if (ageSeconds <= 60) {
    return {
      tone: "warning",
      label: "GPS gecikiyor",
      description: `Son GPS ${ageSeconds} saniye önce alındı.`,
    };
  }

  return {
    tone: "offline",
    label: "Sürücü çevrimdışı olabilir",
    description: `Son GPS ${formatAge(
      ageSeconds,
    )} önce alındı.`,
  };
}

function getLocationTimestamp(
  location,
) {
  return (
    location?.recorded_at ||
    location?.created_at ||
    null
  );
}

function isValidNumber(value) {
  return Number.isFinite(
    Number(value),
  );
}

function formatAge(seconds) {
  if (seconds < 60) {
    return `${seconds} saniye`;
  }

  const minutes = Math.floor(
    seconds / 60,
  );

  if (minutes < 60) {
    return `${minutes} dakika`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  return `${hours} saat`;
}

function Metric({
  label,
  value,
}) {
  return (
    <div className="live-map-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getCoordinate(
  latitude,
  longitude,
) {
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

function getPickupLabel(transfer) {
  return (
    transfer?.pickup_location?.name ||
    transfer?.pickup ||
    "Pickup noktası"
  );
}

function getDropoffLabel(transfer) {
  return (
    transfer?.dropoff_location?.name ||
    transfer?.dropoff ||
    "Dropoff noktası"
  );
}

function formatDateTime(value) {
  if (!value) {
    return "Henüz GPS yok";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getRouteWaypoints({
  status,
  driver,
  pickup,
  dropoff,
}) {
  if (
    [
      "passenger_on_board",
      "trip_started",
    ].includes(status)
  ) {
    return uniqueCoordinates([
      driver || pickup,
      dropoff,
    ]);
  }

  if (
    [
      "completed",
      "no_show",
      "cancelled",
    ].includes(status)
  ) {
    return uniqueCoordinates([
      pickup,
      dropoff,
    ]);
  }

  return uniqueCoordinates([
    driver,
    pickup,
    dropoff,
  ]);
}

function uniqueCoordinates(points) {
  const seen = new Set();

  return points
    .filter(Boolean)
    .filter(([latitude, longitude]) => {
      const key =
        `${latitude.toFixed(5)},${longitude.toFixed(5)}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

async function loadRoadRoute(
  waypoints,
  signal,
) {
  const coordinates = waypoints
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

function getRouteStateLabel(state) {
  const labels = {
    idle: "Koordinat bekleniyor",
    loading: "Hesaplanıyor",
    ready: "Karayolu rotası hazır",
    error: "Rota servisine ulaşılamadı",
  };

  return labels[state] || labels.idle;
}

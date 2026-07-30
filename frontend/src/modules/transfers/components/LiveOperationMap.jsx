import { useEffect, useMemo } from "react";

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

export default function LiveOperationMap() {
  const { selectedTransfer } = useTransfer();

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

  const routePoints = [
    driver || pickup,
    pickup,
    dropoff,
  ].filter(Boolean);

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

        <FitMapBounds points={availablePoints} />

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

        {routePoints.length >= 2 && (
          <Polyline
            positions={routePoints}
            pathOptions={{
              weight: 4,
              opacity: 0.75,
            }}
          />
        )}
      </MapContainer>

      <MapMetrics
        transfer={selectedTransfer}
        driver={driver}
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
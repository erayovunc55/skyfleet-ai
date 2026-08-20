import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const defaultCenter = [41.0082, 28.9784];
const ACTIVE_STATUSES = new Set([
  "accepted",
  "on_the_way",
  "arrived",
  "passenger_called",
  "passenger_on_board",
  "trip_started",
]);

function createDriverIcon(isSelected, isStale) {
  const stateClass = isStale ? " stale" : "";
  const selectedClass = isSelected ? " selected" : "";

  return L.divIcon({
    className: `driver-map-marker${selectedClass}${stateClass}`,
    html: `
      <div class="driver-map-marker__inner">
        🚐
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
}

export default function DispatcherMap({
  transfer,
  transfers = [],
  onSelectTransfer,
}) {
  const pickupPosition = useMemo(
    () =>
      getCoordinatePair(
        transfer?.pickup_lat,
        transfer?.pickup_lng,
      ),
    [transfer?.pickup_lat, transfer?.pickup_lng],
  );

  const dropoffPosition = useMemo(
    () =>
      getCoordinatePair(
        transfer?.dropoff_lat,
        transfer?.dropoff_lng,
      ),
    [transfer?.dropoff_lat, transfer?.dropoff_lng],
  );

  const activeVehicles = useMemo(
    () =>
      transfers
        .filter((item) => ACTIVE_STATUSES.has(item.status))
        .map((item) => ({
          transfer: item,
          position: getCoordinatePair(
            item?.latest_location?.latitude,
            item?.latest_location?.longitude,
          ),
        }))
        .filter((item) => item.position),
    [transfers],
  );

  const selectedDriverPosition = useMemo(
    () =>
      getCoordinatePair(
        transfer?.latest_location?.latitude,
        transfer?.latest_location?.longitude,
      ),
    [
      transfer?.latest_location?.latitude,
      transfer?.latest_location?.longitude,
    ],
  );

  const positions = useMemo(
    () => {
      const all = [
        ...activeVehicles.map((item) => item.position),
        pickupPosition,
        dropoffPosition,
      ].filter(Boolean);

      return dedupePositions(all);
    }, [activeVehicles, pickupPosition, dropoffPosition],
  );

  const center =
    selectedDriverPosition ||
    activeVehicles[0]?.position ||
    pickupPosition ||
    dropoffPosition ||
    defaultCenter;

  return (
    <div className="dispatcher-map">
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom
        className="dispatcher-leaflet-map"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController positions={positions} />

        {pickupPosition && (
          <Marker position={pickupPosition}>
            <Popup>
              <strong>Alış Noktası</strong>
              <br />
              {transfer?.pickup}
            </Popup>
          </Marker>
        )}

        {dropoffPosition && (
          <Marker position={dropoffPosition}>
            <Popup>
              <strong>Bırakış Noktası</strong>
              <br />
              {transfer?.dropoff}
            </Popup>
          </Marker>
        )}

        {activeVehicles.map(({ transfer: item, position }) => {
          const isSelected = item.id === transfer?.id;
          const isStale = locationIsStale(item.latest_location?.recorded_at);

          return (
            <Marker
              key={`driver-${item.id}`}
              position={position}
              icon={createDriverIcon(isSelected, isStale)}
              eventHandlers={{
                click: () => onSelectTransfer?.(item),
              }}
            >
              <Popup>
                <strong>{item.booking_reference || `Transfer #${item.id}`}</strong>
                <br />
                {getStatusLabel(item.status)}
                <br />
                Sürücü: {item?.driver?.name || "Atanmamış"}
                <br />
                Araç: {getVehicleLabel(item)}
                <br />
                Hız: {formatSpeed(item?.latest_location?.speed)}
                <br />
                Hassasiyet: {formatAccuracy(item?.latest_location?.accuracy)}
                <br />
                Son GPS: {formatDateTime(item?.latest_location?.recorded_at)}
                {isStale && (
                  <>
                    <br />
                    <strong>⚠ GPS güncel değil</strong>
                  </>
                )}
              </Popup>
            </Marker>
          );
        })}

        {pickupPosition && dropoffPosition && (
          <Polyline
            positions={[pickupPosition, dropoffPosition]}
            pathOptions={{ weight: 5, opacity: 0.8 }}
          />
        )}

        {selectedDriverPosition && pickupPosition && (
          <Polyline
            positions={[selectedDriverPosition, pickupPosition]}
            pathOptions={{
              weight: 4,
              opacity: 0.7,
              dashArray: "8 10",
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}

function MapController({ positions }) {
  const map = useMap();

  useEffect(() => {
    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize({
        pan: false,
        debounceMoveend: true,
      });

      if (positions.length > 1) {
        map.fitBounds(positions, {
          padding: [50, 50],
          maxZoom: 13,
        });
      } else if (positions.length === 1) {
        map.setView(positions[0], 12);
      } else {
        map.setView(defaultCenter, 10);
      }
    }, 200);

    return () => window.clearTimeout(resizeTimer);
  }, [map, positions]);

  return null;
}

function dedupePositions(positions) {
  const seen = new Set();
  return positions.filter((position) => {
    const key = `${position[0].toFixed(6)}:${position[1].toFixed(6)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getCoordinatePair(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return [lat, lng];
}

function locationIsStale(value) {
  if (!value) return true;
  const recordedAt = new Date(value).getTime();
  if (!Number.isFinite(recordedAt)) return true;
  return Date.now() - recordedAt > 60 * 1000;
}

function getVehicleLabel(transfer) {
  const vehicle = transfer?.assigned_vehicle || transfer?.driver?.vehicle;
  if (!vehicle) return "Atanmamış";
  return [vehicle.plate, vehicle.brand, vehicle.model]
    .filter(Boolean)
    .join(" · ");
}

function getStatusLabel(status) {
  const labels = {
    accepted: "Kabul Edildi",
    on_the_way: "Yola Çıktı",
    arrived: "Alış Noktasında",
    passenger_called: "Yolcu Arandı",
    passenger_on_board: "Yolcu Araçta",
    trip_started: "Yolculuk Başladı",
  };

  return labels[status] || status || "Bilinmiyor";
}

function formatAccuracy(value) {
  const accuracy = Number(value);
  return Number.isFinite(accuracy)
    ? `${Math.round(accuracy)} metre`
    : "Bilinmiyor";
}

function formatSpeed(value) {
  const speed = Number(value);
  if (!Number.isFinite(speed)) return "Bilinmiyor";

  // Backend stores driver location speed as km/h.
  return `${Math.round(speed)} km/s`;
}

function formatDateTime(value) {
  if (!value) return "Bilinmiyor";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Bilinmiyor";

  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

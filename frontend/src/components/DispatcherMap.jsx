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

const driverIcon = L.divIcon({
  className: "driver-map-marker",
  html: `
    <div class="driver-map-marker__inner">
      🚐
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -22],
});

export default function DispatcherMap({ transfer }) {
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

  const driverPosition = useMemo(
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
    () =>
      [
        pickupPosition,
        dropoffPosition,
        driverPosition,
      ].filter(Boolean),
    [
      pickupPosition,
      dropoffPosition,
      driverPosition,
    ],
  );

  const center =
    driverPosition ||
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

        {driverPosition && (
          <Marker
            position={driverPosition}
            icon={driverIcon}
          >
            <Popup>
              <strong>Sürücü Konumu</strong>
              <br />

              {transfer?.driver?.name || "Sürücü"}
              <br />

              Hız:{" "}
              {formatSpeed(
                transfer?.latest_location?.speed,
              )}
              <br />

              Yön:{" "}
              {formatHeading(
                transfer?.latest_location?.heading,
              )}
              <br />

              Hassasiyet:{" "}
              {formatAccuracy(
                transfer?.latest_location?.accuracy,
              )}
              <br />

              Son güncelleme:{" "}
              {formatDateTime(
                transfer?.latest_location?.recorded_at,
              )}
            </Popup>
          </Marker>
        )}

        {pickupPosition && dropoffPosition && (
          <Polyline
            positions={[
              pickupPosition,
              dropoffPosition,
            ]}
            pathOptions={{
              weight: 5,
              opacity: 0.8,
            }}
          />
        )}

        {driverPosition && pickupPosition && (
          <Polyline
            positions={[
              driverPosition,
              pickupPosition,
            ]}
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

    return () => {
      window.clearTimeout(resizeTimer);
    };
  }, [map, positions]);

  return null;
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

function formatAccuracy(value) {
  const accuracy = Number(value);

  if (!Number.isFinite(accuracy)) {
    return "Bilinmiyor";
  }

  return `${Math.round(accuracy)} metre`;
}

function formatSpeed(value) {
  const speedInMetersPerSecond = Number(value);

  if (!Number.isFinite(speedInMetersPerSecond)) {
    return "Bilinmiyor";
  }

  const speedInKilometersPerHour =
    speedInMetersPerSecond * 3.6;

  return `${Math.round(
    speedInKilometersPerHour,
  )} km/s`;
}

function formatHeading(value) {
  const heading = Number(value);

  if (!Number.isFinite(heading)) {
    return "Bilinmiyor";
  }

  return `${Math.round(heading)}°`;
}

function formatDateTime(value) {
  if (!value) {
    return "Bilinmiyor";
  }

  return new Date(value).toLocaleTimeString(
    "tr-TR",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    },
  );
}
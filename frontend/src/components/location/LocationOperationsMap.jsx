import { useEffect, useMemo } from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [41.0082, 28.9784];
const MAX_POINT_DISTANCE_KM = 80;

const COPY = {
  en: {
    center: "Location center",
    pickup: "Pickup point",
    dropoff: "Dropoff point",
    operational: "Operational point",
    geofence: "Geofence",
    unpositioned: "points are not positioned on the map yet.",
    invalid: "points have invalid or out-of-area coordinates.",
  },
  tr: {
    center: "Lokasyon merkezi",
    pickup: "Pickup noktası",
    dropoff: "Dropoff noktası",
    operational: "Operasyon noktası",
    geofence: "Geofence",
    unpositioned: "nokta henüz haritada konumlandırılmadı.",
    invalid: "noktanın koordinatı geçersiz veya operasyon bölgesinin dışında.",
  },
};

export default function LocationOperationsMap({ location, language = "en" }) {
  const text = COPY[language] || COPY.en;
  const locationPosition = coordinatePair(location?.latitude, location?.longitude);
  const points = Array.isArray(location?.points) ? location.points : [];

  const pointCoordinates = useMemo(
    () => points.map(point => ({ point, position: coordinatePair(point.latitude, point.longitude) })),
    [points],
  );

  const positionedPoints = useMemo(
    () => pointCoordinates.filter(({ position }) => {
      if (!position) return false;
      if (!locationPosition) return true;
      return distanceKm(locationPosition, position) <= MAX_POINT_DISTANCE_KM;
    }),
    [pointCoordinates, locationPosition],
  );

  const missingCount = pointCoordinates.filter(item => !item.position).length;
  const invalidCount = pointCoordinates.filter(item => item.position && !positionedPoints.includes(item)).length;

  const positions = useMemo(
    () => [locationPosition, ...positionedPoints.map(item => item.position)].filter(Boolean),
    [locationPosition, positionedPoints],
  );

  const center = locationPosition || positionedPoints[0]?.position || DEFAULT_CENTER;

  return (
    <div className="lop-map-shell">
      <MapContainer center={center} zoom={14} scrollWheelZoom className="lop-map">
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewport positions={positions} center={center} />

        {locationPosition && (
          <>
            {positiveNumber(location?.geofence_radius_meters) && (
              <Circle
                center={locationPosition}
                radius={Number(location.geofence_radius_meters)}
                pathOptions={{ weight: 2, fillOpacity: 0.08 }}
              />
            )}
            <CircleMarker center={locationPosition} radius={9} pathOptions={{ weight: 3, fillOpacity: 0.9 }}>
              <Popup>
                <strong>{location?.name || text.center}</strong><br />
                {text.center}
                {positiveNumber(location?.geofence_radius_meters) && <><br />{text.geofence}: {location.geofence_radius_meters} m</>}
              </Popup>
            </CircleMarker>
          </>
        )}

        {positionedPoints.map(({ point, position }) => (
          <PointLayer key={point.id} point={point} position={position} text={text} />
        ))}
      </MapContainer>

      <div className="lop-map-legend">
        <span><i className="is-center" />{text.center}</span>
        <span><i className="is-pickup" />{text.pickup}</span>
        <span><i className="is-dropoff" />{text.dropoff}</span>
        {missingCount > 0 && <b>{missingCount} {text.unpositioned}</b>}
        {invalidCount > 0 && <b>{invalidCount} {text.invalid}</b>}
      </div>
    </div>
  );
}

function PointLayer({ point, position, text }) {
  const label = point.is_dropoff_allowed && !point.is_pickup_allowed
    ? text.dropoff
    : point.is_pickup_allowed
      ? text.pickup
      : text.operational;

  return (
    <>
      {positiveNumber(point.geofence_radius_meters) && (
        <Circle
          center={position}
          radius={Number(point.geofence_radius_meters)}
          pathOptions={{ weight: 2, fillOpacity: 0.1 }}
        />
      )}
      <CircleMarker center={position} radius={7} pathOptions={{ weight: 2, fillOpacity: 0.92 }}>
        <Popup>
          <strong>{point.name}</strong><br />
          {label}
          {point.airport_terminal?.name && <><br />{point.airport_terminal.name}</>}
          {positiveNumber(point.geofence_radius_meters) && <><br />{text.geofence}: {point.geofence_radius_meters} m</>}
          {point.instructions && <><br /><br />{point.instructions}</>}
        </Popup>
      </CircleMarker>
    </>
  );
}

function MapViewport({ positions, center }) {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize({ pan: false, debounceMoveend: true });
      if (positions.length > 1) {
        map.fitBounds(positions, { padding: [38, 38], maxZoom: 16 });
      } else {
        map.setView(center, 14);
      }
    }, 180);

    return () => window.clearTimeout(timer);
  }, [map, positions, center]);

  return null;
}

function coordinatePair(latitude, longitude) {
  if (latitude === null || latitude === undefined || latitude === "" || longitude === null || longitude === undefined || longitude === "") {
    return null;
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  if (Math.abs(lat) < 0.000001 && Math.abs(lng) < 0.000001) return null;

  return [lat, lng];
}

function distanceKm([lat1, lng1], [lat2, lng2]) {
  const toRad = value => value * Math.PI / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0;
}

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

const COPY = {
  en: {
    center: "Location center",
    pickup: "Pickup point",
    dropoff: "Dropoff point",
    operational: "Operational point",
    geofence: "Geofence",
    noCoordinates: "No coordinates",
    unpositioned: "points are not positioned on the map yet.",
  },
  tr: {
    center: "Lokasyon merkezi",
    pickup: "Pickup noktası",
    dropoff: "Dropoff noktası",
    operational: "Operasyon noktası",
    geofence: "Geofence",
    noCoordinates: "Koordinat yok",
    unpositioned: "nokta henüz haritada konumlandırılmadı.",
  },
};

export default function LocationOperationsMap({ location, language = "en" }) {
  const text = COPY[language] || COPY.en;
  const locationPosition = coordinatePair(location?.latitude, location?.longitude);
  const points = Array.isArray(location?.points) ? location.points : [];

  const positionedPoints = useMemo(
    () => points.map(point => ({ point, position: coordinatePair(point.latitude, point.longitude) })).filter(item => item.position),
    [points],
  );

  const unpositionedCount = points.length - positionedPoints.length;
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
        {unpositionedCount > 0 && <b>{unpositionedCount} {text.unpositioned}</b>}
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
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
}

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0;
}

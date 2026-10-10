import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polygon, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { getCities, getCountries, getLocations } from "../../../services/locationService";
import supplierService from "../services/supplierService";
import "../../../styles/modules/supplier-coverage.css";
import "leaflet/dist/leaflet.css";

const COPY = {
  tr: {
    title: "Hizmet Bölgeleri",
    subtitle: "Tedarikçinin hizmet verdiği havalimanlarını ve operasyon kapsamını yönetin.",
    country: "Ülke",
    city: "Şehir",
    airport: "Havalimanı / Lokasyon",
    radius: "Servis yarıçapı (km)",
    pickup: "Pickup",
    dropoff: "Dropoff",
    save: "Kapsama Ekle",
    empty: "Bu tedarikçi için henüz hizmet bölgesi tanımlanmadı.",
    loading: "Hizmet bölgeleri yükleniyor...",
    remove: "Kaldır",
    confirm: "Bu hizmet bölgesi kaldırılsın mı?",
    coverage: "Kapsam",
    operational: "Operasyonel",
    closed: "Kapalı",
    selectCountry: "Ülke seçin",
    selectCity: "Şehir seçin",
    selectAirport: "Havalimanı seçin",
    noLocations: "Bu şehir için aktif havalimanı/lokasyon bulunamadı.",
    duplicate: "Bu havalimanı zaten tedarikçinin hizmet alanında.",
    saved: "Hizmet bölgesi eklendi.",
    updated: "Hizmet bölgesi güncellendi.",
    deleted: "Hizmet bölgesi kaldırıldı.",
    error: "İşlem tamamlanamadı.",
    airports: "Havalimanı",
    basePrice: "Taban fiyat",
    zoneName: "Bölge adı",
    zoneNameHint: "Örn. İstanbul Havalimanı - Avrupa Yakası",
    currency: "Para birimi",
    vehiclePrices: "Araç fiyatları JSON",
    airportPickup: "Airport Pickup fiyatları",
    airportDropoff: "Airport Dropoff fiyatları",
    vehicleStandard: "Standard Car",
    vehiclePeople: "People Carrier",
    vehicleLargePeople: "Large People Carrier",
    vehicleExecutive: "Executive People Carrier",
    perTransfer: "transfer başına",
    polygon: "Polygon koordinatları JSON",
    pricingHint: "Örnek: {\"sedan\":45,\"van\":65}",
    polygonHint: "Örnek: [[41.05,28.97],[41.02,29.02],[40.99,28.98]]",
    drawHint: "Haritaya tıklayarak bölge sınırı çizin.", clearPolygon: "Polygonu temizle", undoPoint: "Son noktayı geri al", points: "nokta", polygonReady: "Polygon hazır",
    selectLocationError: "Önce bir havalimanı/lokasyon seçin.", polygonPointsError: "Polygon için en az 3 nokta çizin.",
  },
  en: {
    title: "Service Coverage",
    subtitle: "Manage the airports and operating scope served by this supplier.",
    country: "Country",
    city: "City",
    airport: "Airport / Location",
    radius: "Service radius (km)",
    pickup: "Pickup",
    dropoff: "Dropoff",
    save: "Add Coverage",
    empty: "No service coverage has been configured for this supplier yet.",
    loading: "Loading service coverage...",
    remove: "Remove",
    confirm: "Remove this service coverage?",
    coverage: "Coverage",
    operational: "Operational",
    closed: "Closed",
    selectCountry: "Select country",
    selectCity: "Select city",
    selectAirport: "Select airport",
    noLocations: "No active airport/location was found for this city.",
    duplicate: "This airport is already covered by the supplier.",
    saved: "Service coverage added.",
    updated: "Service coverage updated.",
    deleted: "Service coverage removed.",
    error: "Operation failed.",
    airports: "Airport",
    basePrice: "Base price",
    zoneName: "Zone name",
    zoneNameHint: "E.g. Istanbul Airport - European Side",
    currency: "Currency",
    vehiclePrices: "Vehicle prices JSON",
    airportPickup: "Airport Pickup prices",
    airportDropoff: "Airport Dropoff prices",
    vehicleStandard: "Standard Car",
    vehiclePeople: "People Carrier",
    vehicleLargePeople: "Large People Carrier",
    vehicleExecutive: "Executive People Carrier",
    perTransfer: "per transfer",
    polygon: "Polygon coordinates JSON",
    pricingHint: "Example: {\"sedan\":45,\"van\":65}",
    polygonHint: "Example: [[41.05,28.97],[41.02,29.02],[40.99,28.98]]",
    drawHint: "Click the map to draw the service boundary.", clearPolygon: "Clear polygon", undoPoint: "Undo last point", points: "points", polygonReady: "Polygon ready",
    selectLocationError: "Select an airport/location first.", polygonPointsError: "Draw at least 3 points for a polygon.",
  },
};
COPY.ar = { ...COPY.en, title: "نطاق الخدمة", remove: "إزالة" };
COPY.es = { ...COPY.en, title: "Cobertura de Servicio", remove: "Eliminar" };

const EMPTY_FORM = {
  country_id: "",
  city_id: "",
  location_id: "",
  label: "",
  service_radius_km: 15,
  pickup_enabled: true,
  dropoff_enabled: true,
  is_active: true,
  base_price: "",
  currency: "EUR",
  vehicle_prices: { pickup: {}, dropoff: {} },
  polygon: "",
};

export default function SupplierCoverageCenter({ supplierId, language = "en" }) {
  const text = COPY[language] || COPY.en;
  const [rows, setRows] = useState([]);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [priceMode, setPriceMode] = useState("pickup");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [coverageRows, countryRows] = await Promise.all([
        supplierService.getCoverages(supplierId),
        getCountries(),
      ]);
      setRows(coverageRows);
      setCountries(countryRows);
    } catch (error) {
      setNotice(error?.response?.data?.message || error?.message || text.error);
    } finally {
      setLoading(false);
    }
  }, [supplierId, text.error]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    async function loadCities() {
      setCities([]);
      setLocations([]);
      if (!form.country_id) return;
      setLoadingCities(true);
      try {
        const data = await getCities(form.country_id);
        if (!cancelled) setCities(data);
      } catch (error) {
        if (!cancelled) setNotice(error?.response?.data?.message || error?.message || text.error);
      } finally {
        if (!cancelled) setLoadingCities(false);
      }
    }
    loadCities();
    return () => { cancelled = true; };
  }, [form.country_id, text.error]);

  useEffect(() => {
    let cancelled = false;
    async function loadLocations() {
      setLocations([]);
      if (!form.city_id) return;
      setLoadingLocations(true);
      try {
        const data = await getLocations(form.city_id, { type: "airport" });
        if (!cancelled) setLocations(data);
      } catch (error) {
        if (!cancelled) setNotice(error?.response?.data?.message || error?.message || text.error);
      } finally {
        if (!cancelled) setLoadingLocations(false);
      }
    }
    loadLocations();
    return () => { cancelled = true; };
  }, [form.city_id, text.error]);

  const available = useMemo(() => locations, [locations]);

  function changeCountry(value) {
    setNotice("");
    setForm((current) => ({ ...current, country_id: value, city_id: "", location_id: "" }));
  }

  function changeLocation(value) {
    setForm((current) => ({ ...current, location_id: value }));
    setPolygonPoints([]);
  }

  function changeCity(value) {
    setNotice("");
    setForm((current) => ({ ...current, city_id: value, location_id: "" }));
  }

  async function addCoverage(event) {
    event.preventDefault();
    if (!form.location_id) {
      setNotice(text.selectLocationError);
      return;
    }
    if (polygonPoints.length > 0 && polygonPoints.length < 3) {
      setNotice(text.polygonPointsError);
      return;
    }
    if (polygonPoints.length >= 3 && (!form.label.trim() || form.base_price === "")) {
      setNotice(language === "tr" ? "Polygon için bölge adı ve taban fiyat zorunludur." : "Zone name and base price are required for a polygon.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const radiusKm = Number(form.service_radius_km);
      const cleanPrices = (form.vehicle_prices?.["pickup"] || {}) || {};
      const cleanDropoffPrices = (form.vehicle_prices?.["dropoff"] || {}) || {};
      const vehiclePrices = {
        pickup: Object.fromEntries(Object.entries(cleanPrices).filter(([, value]) => value !== "" && value !== null && value !== undefined)),
        dropoff: Object.fromEntries(Object.entries(cleanDropoffPrices).filter(([, value]) => value !== "" && value !== null && value !== undefined)),
      };
      await supplierService.addCoverage(supplierId, {
        location_id: Number(form.location_id),
        service_radius_meters: Number.isFinite(radiusKm) ? Math.round(radiusKm * 1000) : null,
        pickup_enabled: form.pickup_enabled,
        dropoff_enabled: form.dropoff_enabled,
        is_active: form.is_active,
        coverage_type: polygonPoints.length >= 3 ? "polygon" : "airport",
        label: form.label.trim() || undefined,
        base_price: form.base_price === "" ? null : Number(form.base_price),
        currency: form.currency,
        vehicle_prices: vehiclePrices,
        polygon: polygonPoints.length >= 3 ? polygonPoints : null,
      });
      setForm(EMPTY_FORM);
      setPolygonPoints([]);
      setPriceMode("pickup");
      setCities([]);
      setLocations([]);
      await load();
      setNotice(text.saved);
    } catch (error) {
      setNotice(error?.response?.data?.message || error?.message || text.error);
    } finally {
      setBusy(false);
    }
  }

  async function patch(row, key, value) {
    setBusy(true);
    setNotice("");
    try {
      await supplierService.updateCoverage(supplierId, row.id, { [key]: value });
      await load();
      setNotice(text.updated);
    } catch (error) {
      setNotice(error?.response?.data?.message || error?.message || text.error);
    } finally {
      setBusy(false);
    }
  }

  async function remove(row) {
    if (!window.confirm(text.confirm)) return;
    setBusy(true);
    setNotice("");
    try {
      await supplierService.deleteCoverage(supplierId, row.id);
      await load();
      setNotice(text.deleted);
    } catch (error) {
      setNotice(error?.response?.data?.message || error?.message || text.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="supplier-coverage-center">
      <section className="supplier-coverage-head">
        <div><span>SUPPLIER NETWORK</span><h3>{text.title}</h3><p>{text.subtitle}</p></div>
        <div className="supplier-coverage-kpi"><span>{text.airports}</span><strong>{rows.filter((row) => row.is_active).length}</strong></div>
      </section>

      {notice && <div className="supplier-coverage-notice">{notice}</div>}

      <form className="supplier-coverage-form" onSubmit={addCoverage}>
        <label>
          <span>{text.country}</span>
          <select required value={form.country_id} onChange={(event) => changeCountry(event.target.value)}>
            <option value="">{text.selectCountry}</option>
            {countries.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}
          </select>
        </label>

        <label>
          <span>{text.city}</span>
          <select required disabled={!form.country_id || loadingCities} value={form.city_id} onChange={(event) => changeCity(event.target.value)}>
            <option value="">{loadingCities ? "…" : text.selectCity}</option>
            {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
          </select>
        </label>

        <label>
          <span>{text.airport}</span>
          <select required disabled={!form.city_id || loadingLocations} value={form.location_id} onChange={(event) => changeLocation(event.target.value)}>
            <option value="">{loadingLocations ? "…" : text.selectAirport}</option>
            {available.map((location) => (
              <option key={location.id} value={location.id}>
                {location.airport?.iata_code || location.code || "—"} · {location.name}
              </option>
            ))}
          </select>
          {form.city_id && !loadingLocations && locations.length === 0 && <small>{text.noLocations}</small>}
        </label>

        <label className="supplier-coverage-wide-field">
          <span>{text.zoneName}</span>
          <input type="text" required={polygonPoints.length >= 3} placeholder={text.zoneNameHint} value={form.label} onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))} />
        </label>

        <label>
          <span>{text.radius}</span>
          <input type="number" min="0" max="500" step="1" value={form.service_radius_km} onChange={(event) => setForm((current) => ({ ...current, service_radius_km: event.target.value }))} />
        </label>

        <label>
          <span>{text.basePrice}</span>
          <input type="number" min="0" step="0.01" value={form.base_price} onChange={(event) => setForm((current) => ({ ...current, base_price: event.target.value }))} />
        </label>

        <label>
          <span>{text.currency}</span>
          <select value={form.currency} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))}><option>EUR</option><option>USD</option><option>GBP</option><option>TRY</option></select>
        </label>

        <section className="supplier-coverage-pricing">
          <div className="supplier-coverage-pricing-head">
            <div><span>{text.vehiclePrices}</span><small>{text.perTransfer}</small></div>
            <div className="supplier-coverage-price-tabs">
              <button type="button" className={priceMode === "pickup" ? "active" : ""} onClick={() => setPriceMode("pickup")}>{text.airportPickup}</button>
              <button type="button" className={priceMode === "dropoff" ? "active" : ""} onClick={() => setPriceMode("dropoff")}>{text.airportDropoff}</button>
            </div>
          </div>
          <div className="supplier-coverage-vehicle-cards">
            {[
              ["standard_car", text.vehicleStandard, "🚘"],
              ["people_carrier", text.vehiclePeople, "🚐"],
              ["large_people_carrier", text.vehicleLargePeople, "🚌"],
              ["executive_people_carrier", text.vehicleExecutive, "✨"],
            ].map(([key, label, icon]) => (
              <label className="supplier-coverage-vehicle-card" key={key}>
                <span className="supplier-coverage-vehicle-icon">{icon}</span>
                <strong>{label}</strong>
                <div><input type="number" min="0" step="0.01" placeholder="0.00" value={form.vehicle_prices?.[priceMode]?.[key] || ""} onChange={(event) => setForm((current) => ({ ...current, vehicle_prices: { ...current.vehicle_prices, [priceMode]: { ...current.vehicle_prices[priceMode], [key]: event.target.value === "" ? "" : Number(event.target.value) } } }))} /><small>{form.currency}</small></div>
              </label>
            ))}
          </div>
        </section>

        <div className="supplier-coverage-map-field">
          <span>{text.polygon}</span>
          <PolygonEditor
            center={getLocationCenter(locations, form.location_id)}
            points={polygonPoints}
            onChange={setPolygonPoints}
          />
          <div className="supplier-coverage-map-actions">
            <small>{text.drawHint} {polygonPoints.length > 0 ? `${polygonPoints.length} ${text.points}` : ""}</small>
            {polygonPoints.length > 0 && <button type="button" className="supplier-coverage-undo" onClick={() => setPolygonPoints((current) => current.slice(0, -1))}>{text.undoPoint}</button>}
            {polygonPoints.length > 0 && <button type="button" className="supplier-coverage-clear" onClick={() => setPolygonPoints([])}>{text.clearPolygon}</button>}
            {polygonPoints.length >= 3 && <span className="supplier-coverage-ready">✓ {text.polygonReady}</span>}
          </div>
        </div>

        <div className="supplier-coverage-checks">
          <label><input type="checkbox" checked={form.pickup_enabled} onChange={(event) => setForm((current) => ({ ...current, pickup_enabled: event.target.checked }))} />{text.pickup}</label>
          <label><input type="checkbox" checked={form.dropoff_enabled} onChange={(event) => setForm((current) => ({ ...current, dropoff_enabled: event.target.checked }))} />{text.dropoff}</label>
        </div>

        <button className="primary" disabled={busy}>{busy ? "…" : `+ ${text.save}`}</button>
      </form>

      {loading ? (
        <div className="supplier-coverage-empty">{text.loading}</div>
      ) : rows.length ? (
        <div className="supplier-coverage-list">
          {rows.map((row) => (
            <article key={row.id} className={!row.is_active ? "is-disabled" : ""}>
              <div className="supplier-coverage-code">{row.location?.code || "LOC"}</div>
              <div className="supplier-coverage-main">
                <strong>{row.label || row.location?.name || "Location"}</strong>
                <span>{row.city?.name || "—"}, {row.country?.name || "—"}</span>
                <small>{row.service_radius_meters ? `${Math.round(row.service_radius_meters / 1000)} km ${text.coverage}` : "—"}</small>
                {row.base_price !== null && row.base_price !== undefined && <small>{row.base_price} {row.currency} · {row.polygon?.length || 0} polygon points</small>}
              </div>
              <div className="supplier-coverage-flags">
                <label><input type="checkbox" checked={Boolean(row.pickup_enabled)} disabled={busy} onChange={(event) => patch(row, "pickup_enabled", event.target.checked)} />{text.pickup}</label>
                <label><input type="checkbox" checked={Boolean(row.dropoff_enabled)} disabled={busy} onChange={(event) => patch(row, "dropoff_enabled", event.target.checked)} />{text.dropoff}</label>
              </div>
              <div className="supplier-coverage-state">
                <button type="button" className={row.is_active ? "is-active" : "is-closed"} disabled={busy} onClick={() => patch(row, "is_active", !row.is_active)}>{row.is_active ? text.operational : text.closed}</button>
                <button type="button" className="danger" disabled={busy} onClick={() => remove(row)}>{text.remove}</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="supplier-coverage-empty">{text.empty}</div>
      )}
    </div>
  );
}

function PolygonEditor({ center, points, onChange }) {
  const mapCenter = center || [41.0082, 28.9784];

  return (
    <div className="supplier-coverage-map-wrap">
      <MapContainer center={mapCenter} zoom={12} scrollWheelZoom className="supplier-coverage-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <PolygonClickHandler onChange={onChange} />
        {points.map((point, index) => (
          <DraggablePolygonPoint
            key={`${point[0]}-${point[1]}-${index}`}
            position={point}
            radius={index === 0 ? 7 : 5}
            index={index}
            onMove={(nextPoint) => onChange((current) => current.map((item, itemIndex) => itemIndex === index ? nextPoint : item))}
          />
        ))}
        {points.length >= 3 && <Polygon positions={points} pathOptions={{ color: "#22d3ee", fillColor: "#0ea5e9", fillOpacity: 0.2 }} />}
      </MapContainer>
    </div>
  );
}

function DraggablePolygonPoint({ position, index, onMove }) {
  const icon = L.divIcon({
    className: "supplier-polygon-vertex-wrap",
    html: `<span class="supplier-polygon-vertex ${index === 0 ? "start" : ""}">${index + 1}</span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

  return (
    <Marker
      position={position}
      icon={icon}
      draggable
      eventHandlers={{
        dragend: (event) => {
          const next = event.target.getLatLng();
          onMove([Number(next.lat.toFixed(6)), Number(next.lng.toFixed(6))]);
        },
      }}
    />
  );
}

function PolygonClickHandler({ onChange }) {
  useMapEvents({
    click(event) {
      onChange((current) => [...current, [Number(event.latlng.lat.toFixed(6)), Number(event.latlng.lng.toFixed(6))]]);
    },
  });

  return null;
}

function getLocationCenter(locations, locationId) {
  const location = locations.find((item) => Number(item.id) === Number(locationId));
  if (!location || !Number.isFinite(Number(location.latitude)) || !Number.isFinite(Number(location.longitude))) return null;
  return [Number(location.latitude), Number(location.longitude)];
}

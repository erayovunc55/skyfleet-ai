import { useEffect, useMemo, useState } from "react";
import { getCities, getCountries, getLocations } from "../../../services/locationService";
import supplierService from "../services/supplierService";
import "../../../styles/modules/supplier-coverage.css";

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
  },
};
COPY.ar = { ...COPY.en, title: "نطاق الخدمة", remove: "إزالة" };
COPY.es = { ...COPY.en, title: "Cobertura de Servicio", remove: "Eliminar" };

const EMPTY_FORM = {
  country_id: "",
  city_id: "",
  location_id: "",
  service_radius_km: 15,
  pickup_enabled: true,
  dropoff_enabled: true,
  is_active: true,
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

  async function load() {
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
  }

  useEffect(() => {
    load();
  }, [supplierId]);

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
  }, [form.country_id]);

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
  }, [form.city_id]);

  const available = useMemo(() => {
    const used = new Set(rows.map((row) => Number(row.location_id)));
    return locations.filter((location) => !used.has(Number(location.id)));
  }, [rows, locations]);

  function changeCountry(value) {
    setNotice("");
    setForm((current) => ({ ...current, country_id: value, city_id: "", location_id: "" }));
  }

  function changeCity(value) {
    setNotice("");
    setForm((current) => ({ ...current, city_id: value, location_id: "" }));
  }

  async function addCoverage(event) {
    event.preventDefault();
    if (!form.location_id) return;
    if (rows.some((row) => Number(row.location_id) === Number(form.location_id))) {
      setNotice(text.duplicate);
      return;
    }

    setBusy(true);
    setNotice("");
    try {
      const radiusKm = Number(form.service_radius_km);
      await supplierService.addCoverage(supplierId, {
        location_id: Number(form.location_id),
        service_radius_meters: Number.isFinite(radiusKm) ? Math.round(radiusKm * 1000) : null,
        pickup_enabled: form.pickup_enabled,
        dropoff_enabled: form.dropoff_enabled,
        is_active: form.is_active,
        coverage_type: "airport",
      });
      setForm(EMPTY_FORM);
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
          <select required disabled={!form.city_id || loadingLocations} value={form.location_id} onChange={(event) => setForm((current) => ({ ...current, location_id: event.target.value }))}>
            <option value="">{loadingLocations ? "…" : text.selectAirport}</option>
            {available.map((location) => (
              <option key={location.id} value={location.id}>
                {location.airport?.iata_code || location.code || "—"} · {location.name}
              </option>
            ))}
          </select>
          {form.city_id && !loadingLocations && locations.length === 0 && <small>{text.noLocations}</small>}
        </label>

        <label>
          <span>{text.radius}</span>
          <input type="number" min="0" max="500" step="1" value={form.service_radius_km} onChange={(event) => setForm((current) => ({ ...current, service_radius_km: event.target.value }))} />
        </label>

        <div className="supplier-coverage-checks">
          <label><input type="checkbox" checked={form.pickup_enabled} onChange={(event) => setForm((current) => ({ ...current, pickup_enabled: event.target.checked }))} />{text.pickup}</label>
          <label><input type="checkbox" checked={form.dropoff_enabled} onChange={(event) => setForm((current) => ({ ...current, dropoff_enabled: event.target.checked }))} />{text.dropoff}</label>
        </div>

        <button className="primary" disabled={busy || !form.location_id}>{busy ? "…" : `+ ${text.save}`}</button>
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

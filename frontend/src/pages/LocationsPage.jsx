import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../i18n";
import {
  getCities,
  getCountries,
  getLocation,
  getLocations,
  getLocationTypes,
} from "../services/locationService";
import "../styles/modules/locations-page.css";

const PAGE_SIZES = [20, 50, 100];

const COPY = {
  en: {
    eyebrow: "GLOBAL MASTER DATA",
    title: "Location Control Center",
    description: "Manage countries, cities, airports, service locations and pickup points from one scalable workspace.",
    refresh: "Refresh",
    countries: "Countries",
    cities: "Cities",
    locations: "Locations",
    airports: "Airports",
    selectCountry: "Select country",
    selectCity: "Select city",
    allTypes: "All location types",
    search: "Search location, code or address...",
    pickupOnly: "Pickup enabled",
    dropoffOnly: "Dropoff enabled",
    name: "Location",
    type: "Type",
    code: "Code",
    coordinates: "Coordinates",
    geofence: "Geofence",
    points: "Points",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    public: "Public",
    private: "Private",
    details: "Details",
    noRows: "No locations match the selected filters.",
    chooseScope: "Select a country and city to view operational locations.",
    loading: "Loading locations...",
    locationDetails: "Location Details",
    address: "Address",
    timezone: "Timezone",
    airport: "Airport",
    radius: "Geofence Radius",
    pointCount: "Pickup / Dropoff Points",
    close: "Close",
    showing: "Showing",
    of: "of",
    page: "Page",
    previous: "Previous",
    next: "Next",
    perPage: "per page",
  },
  tr: {
    eyebrow: "GLOBAL ANA VERİ",
    title: "Lokasyon Kontrol Merkezi",
    description: "Ülke, şehir, havalimanı, servis lokasyonu ve buluşma noktalarını ölçeklenebilir tek ekrandan yönetin.",
    refresh: "Yenile",
    countries: "Ülkeler",
    cities: "Şehirler",
    locations: "Lokasyonlar",
    airports: "Havalimanları",
    selectCountry: "Ülke seçin",
    selectCity: "Şehir seçin",
    allTypes: "Tüm lokasyon türleri",
    search: "Lokasyon, kod veya adres ara...",
    pickupOnly: "Pickup uygun",
    dropoffOnly: "Dropoff uygun",
    name: "Lokasyon",
    type: "Tür",
    code: "Kod",
    coordinates: "Koordinatlar",
    geofence: "Geofence",
    points: "Noktalar",
    status: "Durum",
    active: "Aktif",
    inactive: "Pasif",
    public: "Genel",
    private: "Özel",
    details: "Detay",
    noRows: "Seçilen filtrelere uygun lokasyon bulunamadı.",
    chooseScope: "Operasyon lokasyonlarını görmek için ülke ve şehir seçin.",
    loading: "Lokasyonlar yükleniyor...",
    locationDetails: "Lokasyon Detayı",
    address: "Adres",
    timezone: "Saat Dilimi",
    airport: "Havalimanı",
    radius: "Geofence Yarıçapı",
    pointCount: "Pickup / Dropoff Noktaları",
    close: "Kapat",
    showing: "Gösterilen",
    of: "/",
    page: "Sayfa",
    previous: "Önceki",
    next: "Sonraki",
    perPage: "sayfa başına",
  },
};
COPY.ar = { ...COPY.en, eyebrow: "البيانات الرئيسية العالمية", title: "مركز التحكم بالمواقع", refresh: "تحديث", countries: "الدول", cities: "المدن", locations: "المواقع", airports: "المطارات", selectCountry: "اختر الدولة", selectCity: "اختر المدينة", allTypes: "كل أنواع المواقع", search: "ابحث عن موقع أو رمز أو عنوان...", active: "نشط", inactive: "غير نشط", details: "التفاصيل", close: "إغلاق", perPage: "لكل صفحة" };
COPY.es = { ...COPY.en, eyebrow: "DATOS MAESTROS GLOBALES", title: "Centro de Control de Ubicaciones", refresh: "Actualizar", countries: "Países", cities: "Ciudades", locations: "Ubicaciones", airports: "Aeropuertos", selectCountry: "Seleccionar país", selectCity: "Seleccionar ciudad", allTypes: "Todos los tipos", search: "Buscar ubicación, código o dirección...", active: "Activo", inactive: "Inactivo", details: "Detalles", close: "Cerrar", perPage: "por página" };

export default function LocationsPage() {
  const { language } = useLanguage();
  const text = COPY[language] || COPY.en;
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [types, setTypes] = useState([]);
  const [rows, setRows] = useState([]);
  const [countryId, setCountryId] = useState("");
  const [cityId, setCityId] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [pickupOnly, setPickupOnly] = useState(false);
  const [dropoffOnly, setDropoffOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    Promise.all([getCountries(), getLocationTypes()]).then(([countryRows, typeRows]) => {
      setCountries(countryRows);
      setTypes(typeRows);
    });
  }, []);

  useEffect(() => {
    setCities([]);
    setCityId("");
    setRows([]);
    if (!countryId) return;
    getCities(countryId).then(setCities);
  }, [countryId]);

  async function loadLocations() {
    if (!cityId) { setRows([]); return; }
    setLoading(true);
    try {
      const data = await getLocations(cityId, {
        type: type || undefined,
        search: search.trim() || undefined,
        pickupOnly,
        dropoffOnly,
      });
      setRows(data);
      setPage(1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadLocations(); }, [cityId, type, pickupOnly, dropoffOnly]);

  const airportTypeCodes = new Set(["airport"]);
  const summary = useMemo(() => ({
    countries: countries.length,
    cities: cities.length,
    locations: rows.length,
    airports: rows.filter((item) => airportTypeCodes.has(String(item.type?.code || "").toLowerCase())).length,
  }), [countries, cities, rows]);

  const lastPage = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, lastPage);
  const pageRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const from = rows.length ? (safePage - 1) * pageSize + 1 : 0;
  const to = Math.min(safePage * pageSize, rows.length);

  async function openDetails(id) {
    const detail = await getLocation(id);
    setSelected(detail);
  }

  return <main className="location-control-page">
    <header className="location-control-header">
      <div><span>{text.eyebrow}</span><h1>{text.title}</h1><p>{text.description}</p></div>
      <button type="button" onClick={loadLocations}>↻ {text.refresh}</button>
    </header>

    <section className="location-kpis">
      <Kpi label={text.countries} value={summary.countries} icon="🌍" />
      <Kpi label={text.cities} value={summary.cities} icon="🏙️" />
      <Kpi label={text.locations} value={summary.locations} icon="📍" />
      <Kpi label={text.airports} value={summary.airports} icon="✈️" />
    </section>

    <section className="location-workspace">
      <div className="location-filters">
        <select value={countryId} onChange={(e)=>setCountryId(e.target.value)}><option value="">{text.selectCountry}</option>{countries.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select value={cityId} disabled={!countryId} onChange={(e)=>setCityId(e.target.value)}><option value="">{text.selectCity}</option>{cities.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select value={type} disabled={!cityId} onChange={(e)=>setType(e.target.value)}><option value="">{text.allTypes}</option>{types.map((item)=><option key={item.id} value={item.code}>{item.name}</option>)}</select>
        <input value={search} disabled={!cityId} onChange={(e)=>setSearch(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&loadLocations()} placeholder={text.search}/>
        <button type="button" disabled={!cityId} onClick={loadLocations}>{text.search.split(" ")[0]}</button>
      </div>
      <div className="location-toggle-row">
        <label><input type="checkbox" checked={pickupOnly} onChange={(e)=>setPickupOnly(e.target.checked)}/>{text.pickupOnly}</label>
        <label><input type="checkbox" checked={dropoffOnly} onChange={(e)=>setDropoffOnly(e.target.checked)}/>{text.dropoffOnly}</label>
      </div>

      {!cityId ? <div className="location-empty">{text.chooseScope}</div> : loading ? <div className="location-empty">{text.loading}</div> : pageRows.length ? <div className="location-table-wrap"><table><thead><tr><th>{text.name}</th><th>{text.type}</th><th>{text.code}</th><th>{text.coordinates}</th><th>{text.geofence}</th><th>{text.status}</th><th>{text.details}</th></tr></thead><tbody>{pageRows.map((item)=><tr key={item.id}><td><strong>{item.name}</strong><small>{item.address || item.native_name || "—"}</small></td><td>{item.type?.name || "—"}</td><td>{item.code || "—"}</td><td>{item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : "—"}</td><td>{item.geofence_radius_meters ? `${item.geofence_radius_meters} m` : "—"}</td><td><span className={`location-status ${item.is_active ? "is-active" : "is-inactive"}`}>{item.is_active ? text.active : text.inactive}</span></td><td><button type="button" onClick={()=>openDetails(item.id)}>{text.details}</button></td></tr>)}</tbody></table></div> : <div className="location-empty">{text.noRows}</div>}

      {cityId && <div className="location-pagination"><span>{text.showing} <strong>{from}-{to}</strong> {text.of} <strong>{rows.length}</strong></span><div><button disabled={safePage<=1} onClick={()=>setPage(safePage-1)}>‹ {text.previous}</button><span>{text.page} {safePage} / {lastPage}</span><button disabled={safePage>=lastPage} onClick={()=>setPage(safePage+1)}>{text.next} ›</button></div><label><select value={pageSize} onChange={(e)=>{setPageSize(Number(e.target.value));setPage(1)}}>{PAGE_SIZES.map((size)=><option key={size} value={size}>{size}</option>)}</select><span>{text.perPage}</span></label></div>}
    </section>

    {selected && <div className="location-detail-backdrop" onMouseDown={(e)=>e.target===e.currentTarget&&setSelected(null)}><aside className="location-detail-panel"><header><div><span>{text.locationDetails}</span><h2>{selected.name}</h2></div><button onClick={()=>setSelected(null)}>× {text.close}</button></header><div className="location-detail-grid"><Info label={text.type} value={selected.type?.name}/><Info label={text.code} value={selected.code}/><Info label={text.address} value={selected.address}/><Info label={text.timezone} value={selected.timezone}/><Info label={text.airport} value={selected.airport?.name || selected.airport?.iata_code}/><Info label={text.radius} value={selected.geofence_radius_meters ? `${selected.geofence_radius_meters} m` : null}/><Info label={text.coordinates} value={selected.latitude && selected.longitude ? `${selected.latitude}, ${selected.longitude}` : null}/><Info label={text.pointCount} value={Array.isArray(selected.points) ? selected.points.length : 0}/></div>{selected.points?.length ? <div className="location-point-list"><h3>{text.points}</h3>{selected.points.map((point)=><article key={point.id}><strong>{point.name}</strong><span>{point.point_type || "—"}</span><small>{point.airport_terminal?.name || point.instructions || ""}</small></article>)}</div> : null}</aside></div>}
  </main>;
}

function Kpi({label,value,icon}){return <article className="location-kpi"><div>{icon}</div><span>{label}</span><strong>{value}</strong></article>}
function Info({label,value}){return <div className="location-detail-info"><span>{label}</span><strong>{value || "—"}</strong></div>}

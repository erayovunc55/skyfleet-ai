import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../i18n";
import AirportFinder from "../components/location/AirportFinder";
import ProfessionalLocationOperationsPanel from "../components/location/ProfessionalLocationOperationsPanel";
import {
  createLocation,
  createLocationPoint,
  getCities,
  getCountries,
  getLocation,
  getLocations,
  getLocationTypes,
} from "../services/locationService";
import "../styles/modules/locations-page.css";

const PAGE_SIZES = [20, 50, 100];
const POINT_TYPES = ["meeting_point","pickup_point","dropoff_point","entrance","exit","gate","lobby","reception","parking","platform","dock","custom"];

const COPY = {
  en: {
    eyebrow:"GLOBAL MASTER DATA", title:"Location Control Center", description:"Manage countries, cities, airports, terminals, service locations and pickup points from one scalable workspace.", refresh:"Refresh", add:"Add Location",
    countries:"Countries", cities:"Cities", locations:"Locations", airports:"Airports", selectCountry:"Select country", selectCity:"Select city", allTypes:"All location types", search:"Search location, code or address...", pickupOnly:"Pickup enabled", dropoffOnly:"Dropoff enabled",
    name:"Location", type:"Type", code:"Code", coordinates:"Coordinates", geofence:"Geofence", status:"Status", active:"Active", inactive:"Inactive", details:"Details", noRows:"No locations match the selected filters.", chooseScope:"Select a country and city to view operational locations.", loading:"Loading locations...",
    locationDetails:"Location Operations Center", overview:"Overview", address:"Address", timezone:"Timezone", airport:"Airport", radius:"Geofence Radius", pointCount:"Pickup / Dropoff Points", close:"Close", showing:"Showing", of:"of", page:"Page", previous:"Previous", next:"Next", perPage:"per page",
    newLocation:"New Location", locationName:"Location name", nativeName:"Native name", locationCode:"Location / IATA code", latitude:"Latitude", longitude:"Longitude", public:"Public", save:"Save Location", cancel:"Cancel", iata:"IATA", icao:"ICAO", terminals:"Airport Terminals", terminalName:"Terminal name", terminalCode:"Code", addTerminal:"Add Terminal", remove:"Remove",
    addPoint:"Add Pickup / Dropoff Point", pointName:"Point name", pointType:"Point type", terminal:"Terminal", instructions:"Driver / meeting instructions", pickup:"Pickup", dropoff:"Dropoff", meetGreet:"Meet & greet", savePoint:"Save Point", saved:"Saved successfully.", error:"Operation failed",
    operationalReadiness:"Operational Readiness", terminalCount:"Terminals", pickupPoints:"Pickup Points", dropoffPoints:"Dropoff Points", meetGreetPoints:"Meet & Greet", masterData:"Master Data", noTerminals:"No terminals registered yet.", noPoints:"No operational pickup/dropoff points registered yet.", airportIdentity:"Airport Identity", scope:"Country / City",
  },
  tr: {
    eyebrow:"GLOBAL ANA VERİ", title:"Lokasyon Kontrol Merkezi", description:"Ülke, şehir, havalimanı, terminal, servis lokasyonu ve buluşma noktalarını ölçeklenebilir tek ekrandan yönetin.", refresh:"Yenile", add:"Lokasyon Ekle",
    countries:"Ülkeler", cities:"Şehirler", locations:"Lokasyonlar", airports:"Havalimanları", selectCountry:"Ülke seçin", selectCity:"Şehir seçin", allTypes:"Tüm lokasyon türleri", search:"Lokasyon, kod veya adres ara...", pickupOnly:"Pickup uygun", dropoffOnly:"Dropoff uygun",
    name:"Lokasyon", type:"Tür", code:"Kod", coordinates:"Koordinatlar", geofence:"Geofence", status:"Durum", active:"Aktif", inactive:"Pasif", details:"Detay", noRows:"Seçilen filtrelere uygun lokasyon bulunamadı.", chooseScope:"Operasyon lokasyonlarını görmek için ülke ve şehir seçin.", loading:"Lokasyonlar yükleniyor...",
    locationDetails:"Lokasyon Operasyon Merkezi", overview:"Genel Bakış", address:"Adres", timezone:"Saat Dilimi", airport:"Havalimanı", radius:"Geofence Yarıçapı", pointCount:"Pickup / Dropoff Noktaları", close:"Kapat", showing:"Gösterilen", of:"/", page:"Sayfa", previous:"Önceki", next:"Sonraki", perPage:"sayfa başına",
    newLocation:"Yeni Lokasyon", locationName:"Lokasyon adı", nativeName:"Yerel adı", locationCode:"Lokasyon / IATA kodu", latitude:"Enlem", longitude:"Boylam", public:"Genel", save:"Lokasyonu Kaydet", cancel:"İptal", iata:"IATA", icao:"ICAO", terminals:"Havalimanı Terminalleri", terminalName:"Terminal adı", terminalCode:"Kod", addTerminal:"Terminal Ekle", remove:"Kaldır",
    addPoint:"Pickup / Dropoff Noktası Ekle", pointName:"Nokta adı", pointType:"Nokta türü", terminal:"Terminal", instructions:"Sürücü / karşılama talimatı", pickup:"Pickup", dropoff:"Dropoff", meetGreet:"Karşılama", savePoint:"Noktayı Kaydet", saved:"Başarıyla kaydedildi.", error:"İşlem başarısız",
    operationalReadiness:"Operasyon Hazırlığı", terminalCount:"Terminaller", pickupPoints:"Pickup Noktaları", dropoffPoints:"Dropoff Noktaları", meetGreetPoints:"Karşılama", masterData:"Ana Veriler", noTerminals:"Henüz terminal kaydı yok.", noPoints:"Henüz operasyon pickup/dropoff noktası yok.", airportIdentity:"Havalimanı Kimliği", scope:"Ülke / Şehir",
  },
};
COPY.ar = {...COPY.en, eyebrow:"البيانات الرئيسية العالمية", title:"مركز التحكم بالمواقع", refresh:"تحديث", add:"إضافة موقع", countries:"الدول", cities:"المدن", airports:"المطارات", selectCountry:"اختر الدولة", selectCity:"اختر المدينة", save:"حفظ الموقع", cancel:"إلغاء", addPoint:"إضافة نقطة استقبال / إنزال", savePoint:"حفظ النقطة", close:"إغلاق"};
COPY.es = {...COPY.en, eyebrow:"DATOS MAESTROS GLOBALES", title:"Centro de Control de Ubicaciones", refresh:"Actualizar", add:"Añadir ubicación", countries:"Países", cities:"Ciudades", airports:"Aeropuertos", selectCountry:"Seleccionar país", selectCity:"Seleccionar ciudad", save:"Guardar ubicación", cancel:"Cancelar", addPoint:"Añadir punto de recogida / destino", savePoint:"Guardar punto", close:"Cerrar"};

const emptyLocation = {country_id:"",city_id:"",name:"",native_name:"",location_type_id:"",code:"",address:"",timezone:"",latitude:"",longitude:"",geofence_radius_meters:"",iata_code:"",icao_code:"",is_public:true,is_active:true,terminals:[]};
const emptyPoint = {name:"",code:"",point_type:"meeting_point",airport_terminal_id:"",instructions:"",latitude:"",longitude:"",geofence_radius_meters:"",is_pickup_allowed:true,is_dropoff_allowed:false,requires_meet_and_greet:false};

export default function LocationsPage(){
  const {language} = useLanguage();
  const text = COPY[language] || COPY.en;
  const [countries,setCountries] = useState([]), [cities,setCities] = useState([]), [types,setTypes] = useState([]), [rows,setRows] = useState([]);
  const [countryId,setCountryId] = useState(""), [cityId,setCityId] = useState(""), [type,setType] = useState(""), [search,setSearch] = useState("");
  const [pickupOnly,setPickupOnly] = useState(false), [dropoffOnly,setDropoffOnly] = useState(false), [page,setPage] = useState(1), [pageSize,setPageSize] = useState(20), [loading,setLoading] = useState(false);
  const [selected,setSelected] = useState(null), [editorOpen,setEditorOpen] = useState(false), [form,setForm] = useState(emptyLocation), [formCities,setFormCities] = useState([]);
  const [pointForm,setPointForm] = useState(emptyPoint), [pointOpen,setPointOpen] = useState(false), [busy,setBusy] = useState(false), [notice,setNotice] = useState("");

  useEffect(()=>{ Promise.all([getCountries(),getLocationTypes()]).then(([c,t])=>{setCountries(c);setTypes(t)}); },[]);
  useEffect(()=>{ setCities([]); setCityId(""); setRows([]); if(countryId) getCities(countryId).then(setCities); },[countryId]);

  async function loadLocations(){
    if(!cityId){setRows([]);return;}
    setLoading(true);
    try{ setRows(await getLocations(cityId,{type:type||undefined,search:search.trim()||undefined,pickupOnly,dropoffOnly})); setPage(1); }
    finally{ setLoading(false); }
  }
  useEffect(()=>{loadLocations()},[cityId,type,pickupOnly,dropoffOnly]);

  const summary = useMemo(()=>({countries:countries.length,cities:cities.length,locations:rows.length,airports:rows.filter(x=>String(x.type?.code||"").toLowerCase()==="airport").length}),[countries,cities,rows]);
  const lastPage=Math.max(1,Math.ceil(rows.length/pageSize)), safePage=Math.min(page,lastPage), pageRows=rows.slice((safePage-1)*pageSize,safePage*pageSize), from=rows.length?(safePage-1)*pageSize+1:0, to=Math.min(safePage*pageSize,rows.length);

  async function openDetails(id){ setSelected(await getLocation(id)); setPointOpen(false); setPointForm(emptyPoint); }
  async function openAdd(){
    setNotice("");
    const initialCountry = countryId || countries[0]?.id || "";
    const availableCities = initialCountry ? await getCities(initialCountry) : [];
    setFormCities(availableCities);
    const initialCity = cityId || availableCities[0]?.id || "";
    const airportType = types.find(x=>x.code==="airport");
    const city = availableCities.find(x=>String(x.id)===String(initialCity));
    const country = countries.find(x=>String(x.id)===String(initialCountry));
    setForm({...emptyLocation,country_id:initialCountry,city_id:initialCity,location_type_id:airportType?.id||types[0]?.id||"",timezone:city?.timezone||country?.default_timezone||""});
    setEditorOpen(true);
  }
  const selectedType = types.find(x=>String(x.id)===String(form.location_type_id));
  function patch(key,value){setForm(v=>({...v,[key]:value}));}
  async function changeFormCountry(value){
    const nextCities = value ? await getCities(value) : [];
    setFormCities(nextCities);
    const country = countries.find(x=>String(x.id)===String(value));
    setForm(v=>({...v,country_id:value,city_id:nextCities[0]?.id||"",timezone:v.timezone||country?.default_timezone||""}));
  }
  async function applyAirport(airport){
    const airportType = types.find(x=>x.code==="airport");
    const nextCities = airport.country_id ? await getCities(airport.country_id) : [];
    setFormCities(nextCities);
    setForm(v=>({...v,
      country_id:airport.country_id||v.country_id,
      city_id:airport.city_id||v.city_id,
      location_type_id:airportType?.id||v.location_type_id,
      name:airport.name||v.name,
      code:airport.iata_code||airport.icao_code||v.code,
      iata_code:airport.iata_code||"",
      icao_code:airport.icao_code||"",
      timezone:airport.timezone||airport.city?.timezone||airport.country?.default_timezone||v.timezone,
      latitude:airport.latitude??v.latitude,
      longitude:airport.longitude??v.longitude,
      terminals:Array.isArray(airport.terminals)?airport.terminals.map(t=>({name:t.name,code:t.code||"",type:t.type||"passenger"})):v.terminals,
    }));
  }
  function addTerminal(){patch("terminals",[...form.terminals,{name:"",code:"",type:"passenger"}]);}
  function patchTerminal(i,key,value){patch("terminals",form.terminals.map((t,n)=>n===i?{...t,[key]:value}:t));}

  async function saveLocation(e){
    e.preventDefault(); setBusy(true); setNotice("");
    try{
      await createLocation({...form,country_id:Number(form.country_id),city_id:Number(form.city_id),location_type_id:Number(form.location_type_id),latitude:form.latitude||null,longitude:form.longitude||null,geofence_radius_meters:form.geofence_radius_meters||null});
      setEditorOpen(false); setNotice(text.saved);
      setCountryId(String(form.country_id));
      const nextCities = await getCities(form.country_id); setCities(nextCities); setCityId(String(form.city_id));
      setTimeout(loadLocations,50);
    }catch(err){setNotice(err.message||text.error);}finally{setBusy(false);}
  }
  async function savePoint(e){
    e.preventDefault(); if(!selected)return; setBusy(true); setNotice("");
    try{
      await createLocationPoint(selected.id,{...pointForm,airport_terminal_id:pointForm.airport_terminal_id?Number(pointForm.airport_terminal_id):null,latitude:pointForm.latitude||null,longitude:pointForm.longitude||null,geofence_radius_meters:pointForm.geofence_radius_meters||null});
      setSelected(await getLocation(selected.id)); setPointForm(emptyPoint); setPointOpen(false); setNotice(text.saved);
    }catch(err){setNotice(err.message||text.error);}finally{setBusy(false);}
  }

  return <main className="location-control-page">
    <header className="location-control-header"><div><span>{text.eyebrow}</span><h1>{text.title}</h1><p>{text.description}</p></div><div className="location-header-actions"><button type="button" onClick={loadLocations}>↻ {text.refresh}</button><button className="primary" type="button" disabled={!countries.length} onClick={openAdd}>+ {text.add}</button></div></header>
    {notice&&<div className="location-notice">{notice}</div>}
    <section className="location-kpis"><Kpi label={text.countries} value={summary.countries} icon="🌍"/><Kpi label={text.cities} value={summary.cities} icon="🏙️"/><Kpi label={text.locations} value={summary.locations} icon="📍"/><Kpi label={text.airports} value={summary.airports} icon="✈️"/></section>
    <section className="location-workspace">
      <div className="location-filters"><select value={countryId} onChange={e=>setCountryId(e.target.value)}><option value="">{text.selectCountry}</option>{countries.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select><select value={cityId} disabled={!countryId} onChange={e=>setCityId(e.target.value)}><option value="">{text.selectCity}</option>{cities.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select><select value={type} disabled={!cityId} onChange={e=>setType(e.target.value)}><option value="">{text.allTypes}</option>{types.map(x=><option key={x.id} value={x.code}>{x.name}</option>)}</select><input value={search} disabled={!cityId} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&loadLocations()} placeholder={text.search}/><button type="button" disabled={!cityId} onClick={loadLocations}>⌕</button></div>
      <div className="location-toggle-row"><label><input type="checkbox" checked={pickupOnly} onChange={e=>setPickupOnly(e.target.checked)}/>{text.pickupOnly}</label><label><input type="checkbox" checked={dropoffOnly} onChange={e=>setDropoffOnly(e.target.checked)}/>{text.dropoffOnly}</label></div>
      {!cityId?<div className="location-empty">{text.chooseScope}</div>:loading?<div className="location-empty">{text.loading}</div>:pageRows.length?<div className="location-table-wrap"><table><thead><tr><th>{text.name}</th><th>{text.type}</th><th>{text.code}</th><th>{text.coordinates}</th><th>{text.geofence}</th><th>{text.status}</th><th>{text.details}</th></tr></thead><tbody>{pageRows.map(item=><tr key={item.id}><td><strong>{item.name}</strong><small>{item.address||item.native_name||"—"}</small></td><td>{item.type?.name||"—"}</td><td>{item.code||"—"}</td><td>{item.latitude&&item.longitude?`${item.latitude}, ${item.longitude}`:"—"}</td><td>{item.geofence_radius_meters?`${item.geofence_radius_meters} m`:"—"}</td><td><span className={`location-status ${item.is_active?"is-active":"is-inactive"}`}>{item.is_active?text.active:text.inactive}</span></td><td><button onClick={()=>openDetails(item.id)}>{text.details}</button></td></tr>)}</tbody></table></div>:<div className="location-empty">{text.noRows}</div>}
      {cityId&&<div className="location-pagination"><span>{text.showing} <strong>{from}-{to}</strong> {text.of} <strong>{rows.length}</strong></span><div><button disabled={safePage<=1} onClick={()=>setPage(safePage-1)}>‹ {text.previous}</button><span>{text.page} {safePage} / {lastPage}</span><button disabled={safePage>=lastPage} onClick={()=>setPage(safePage+1)}>{text.next} ›</button></div><label><select value={pageSize} onChange={e=>{setPageSize(Number(e.target.value));setPage(1)}}>{PAGE_SIZES.map(s=><option key={s}>{s}</option>)}</select><span>{text.perPage}</span></label></div>}
    </section>

    {editorOpen&&<div className="location-detail-backdrop"><aside className="location-detail-panel location-editor"><header><div><span>{text.eyebrow}</span><h2>{text.newLocation}</h2></div><button onClick={()=>setEditorOpen(false)}>× {text.cancel}</button></header><form onSubmit={saveLocation} className="location-form-grid">
      <Field label={text.selectCountry}><select required value={form.country_id} onChange={e=>changeFormCountry(e.target.value)}><option value="">{text.selectCountry}</option>{countries.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
      <Field label={text.selectCity}><select required value={form.city_id} onChange={e=>patch("city_id",e.target.value)}><option value="">{text.selectCity}</option>{formCities.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
      <Field label={text.type}><select required value={form.location_type_id} onChange={e=>patch("location_type_id",e.target.value)}>{types.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
      {selectedType?.code==="airport"&&<div className="location-airport-finder"><AirportFinder language={language} onSelect={applyAirport}/></div>}
      <Field label={text.locationName}><input required value={form.name} onChange={e=>patch("name",e.target.value)}/></Field><Field label={text.nativeName}><input value={form.native_name} onChange={e=>patch("native_name",e.target.value)}/></Field><Field label={text.locationCode}><input value={form.code} onChange={e=>patch("code",e.target.value)}/></Field><Field label={text.timezone}><input value={form.timezone} onChange={e=>patch("timezone",e.target.value)}/></Field>
      {selectedType?.code==="airport"&&<><Field label={text.iata}><input maxLength="3" value={form.iata_code} onChange={e=>patch("iata_code",e.target.value.toUpperCase())}/></Field><Field label={text.icao}><input maxLength="4" value={form.icao_code} onChange={e=>patch("icao_code",e.target.value.toUpperCase())}/></Field></>}
      <Field label={text.address} wide><textarea value={form.address} onChange={e=>patch("address",e.target.value)}/></Field><Field label={text.latitude}><input type="number" step="any" value={form.latitude} onChange={e=>patch("latitude",e.target.value)}/></Field><Field label={text.longitude}><input type="number" step="any" value={form.longitude} onChange={e=>patch("longitude",e.target.value)}/></Field><Field label={text.radius}><input type="number" min="0" value={form.geofence_radius_meters} onChange={e=>patch("geofence_radius_meters",e.target.value)}/></Field>
      {selectedType?.code==="airport"&&<div className="location-terminal-editor"><div className="section-title"><strong>{text.terminals}</strong><button type="button" onClick={addTerminal}>+ {text.addTerminal}</button></div>{form.terminals.length?form.terminals.map((t,i)=><div className="terminal-row" key={i}><input placeholder={text.terminalName} value={t.name} onChange={e=>patchTerminal(i,"name",e.target.value)}/><input placeholder={text.terminalCode} value={t.code} onChange={e=>patchTerminal(i,"code",e.target.value)}/><button type="button" onClick={()=>patch("terminals",form.terminals.filter((_,n)=>n!==i))}>{text.remove}</button></div>):<div className="location-inline-empty">{text.noTerminals}</div>}</div>}
      <div className="location-form-checks"><label><input type="checkbox" checked={form.is_public} onChange={e=>patch("is_public",e.target.checked)}/>{text.public}</label><label><input type="checkbox" checked={form.is_active} onChange={e=>patch("is_active",e.target.checked)}/>{text.active}</label></div><button className="location-save" disabled={busy}>{busy?"…":text.save}</button>
    </form></aside></div>}

    {selected&&<ProfessionalLocationOperationsPanel initialLocation={selected} language={language} onClose={()=>setSelected(null)} onChanged={(fresh)=>{setSelected(fresh);loadLocations();}}/>}
  </main>;
}

function Kpi({label,value,icon}){return <article className="location-kpi"><div>{icon}</div><span>{label}</span><strong>{value}</strong></article>}
function Field({label,children,wide=false}){return <label className={wide?"wide":""}><span>{label}</span>{children}</label>}

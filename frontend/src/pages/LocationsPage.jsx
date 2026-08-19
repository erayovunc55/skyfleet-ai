import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../i18n";
import AirportFinder from "../components/location/AirportFinder";
import ProfessionalLocationOperationsPanel from "../components/location/ProfessionalLocationOperationsPanel";
import {
  createLocation,
  getAllLocations,
  getCities,
  getCountries,
  getLocation,
  getLocationTypes,
} from "../services/locationService";
import "../styles/modules/locations-page.css";
import "../styles/modules/airport-operations.css";

const PAGE_SIZES = [20, 50, 100];

const COPY = {
  en: {
    eyebrow:"GLOBAL MASTER DATA", title:"Location Control Center", description:"Manage countries, cities, airports, terminals, service locations and pickup points from one scalable workspace.", refresh:"Refresh", add:"Add Location",
    countries:"Countries", cities:"Cities", locations:"Locations", airports:"Airports", selectCountry:"All countries", selectCity:"All cities", allTypes:"All location types", search:"Search airport, IATA, ICAO, city or country...", pickupOnly:"Pickup enabled", dropoffOnly:"Dropoff enabled",
    name:"Location", scope:"Country / City", codes:"Codes", operations:"Operations", coverage:"Map Coverage", status:"Status", active:"Active", inactive:"Inactive", details:"Details", noRows:"No operational locations match the selected filters.", loading:"Loading locations...",
    ready:"Ready", needsMap:"Needs Map", setup:"Setup", terminalsShort:"T", pickupShort:"P", dropoffShort:"D", meetShort:"M&G", mapped:"mapped", noPoints:"No points",
    close:"Close", showing:"Showing", of:"of", page:"Page", previous:"Previous", next:"Next", perPage:"per page", newLocation:"New Location", locationName:"Location name", nativeName:"Native name", locationCode:"Location / IATA code", type:"Type", latitude:"Latitude", longitude:"Longitude", public:"Public", save:"Save Location", cancel:"Cancel", iata:"IATA", icao:"ICAO", terminals:"Airport Terminals", terminalName:"Terminal name", terminalCode:"Code", addTerminal:"Add Terminal", remove:"Remove", address:"Address", timezone:"Timezone", radius:"Geofence Radius", noTerminals:"No terminals registered yet.", saved:"Location saved and added to the global operational list.", error:"Operation failed"
  },
  tr: {
    eyebrow:"GLOBAL ANA VERİ", title:"Lokasyon Kontrol Merkezi", description:"Ülke, şehir, havalimanı, terminal, servis lokasyonu ve buluşma noktalarını ölçeklenebilir tek ekrandan yönetin.", refresh:"Yenile", add:"Lokasyon Ekle",
    countries:"Ülkeler", cities:"Şehirler", locations:"Lokasyonlar", airports:"Havalimanları", selectCountry:"Tüm ülkeler", selectCity:"Tüm şehirler", allTypes:"Tüm lokasyon türleri", search:"Havalimanı, IATA, ICAO, şehir veya ülke ara...", pickupOnly:"Pickup uygun", dropoffOnly:"Dropoff uygun",
    name:"Lokasyon", scope:"Ülke / Şehir", codes:"Kodlar", operations:"Operasyon", coverage:"Harita Durumu", status:"Durum", active:"Aktif", inactive:"Pasif", details:"Detay", noRows:"Seçilen filtrelere uygun operasyon lokasyonu bulunamadı.", loading:"Lokasyonlar yükleniyor...",
    ready:"Hazır", needsMap:"Harita Eksik", setup:"Kurulum", terminalsShort:"T", pickupShort:"P", dropoffShort:"D", meetShort:"M&G", mapped:"haritalı", noPoints:"Nokta yok",
    close:"Kapat", showing:"Gösterilen", of:"/", page:"Sayfa", previous:"Önceki", next:"Sonraki", perPage:"sayfa başına", newLocation:"Yeni Lokasyon", locationName:"Lokasyon adı", nativeName:"Yerel adı", locationCode:"Lokasyon / IATA kodu", type:"Tür", latitude:"Enlem", longitude:"Boylam", public:"Genel", save:"Lokasyonu Kaydet", cancel:"İptal", iata:"IATA", icao:"ICAO", terminals:"Havalimanı Terminalleri", terminalName:"Terminal adı", terminalCode:"Kod", addTerminal:"Terminal Ekle", remove:"Kaldır", address:"Adres", timezone:"Saat Dilimi", radius:"Geofence Yarıçapı", noTerminals:"Henüz terminal kaydı yok.", saved:"Lokasyon kaydedildi ve global operasyon listesine eklendi.", error:"İşlem başarısız"
  },
};
COPY.ar = {...COPY.en, eyebrow:"البيانات الرئيسية العالمية", title:"مركز التحكم بالمواقع", refresh:"تحديث", add:"إضافة موقع", countries:"الدول", cities:"المدن", airports:"المطارات", selectCountry:"كل الدول", selectCity:"كل المدن", save:"حفظ الموقع", cancel:"إلغاء"};
COPY.es = {...COPY.en, eyebrow:"DATOS MAESTROS GLOBALES", title:"Centro de Control de Ubicaciones", refresh:"Actualizar", add:"Añadir ubicación", countries:"Países", cities:"Ciudades", airports:"Aeropuertos", selectCountry:"Todos los países", selectCity:"Todas las ciudades", save:"Guardar ubicación", cancel:"Cancelar"};

const emptyLocation = {country_id:"",city_id:"",name:"",native_name:"",location_type_id:"",code:"",address:"",timezone:"",latitude:"",longitude:"",geofence_radius_meters:"",iata_code:"",icao_code:"",is_public:true,is_active:true,terminals:[]};

export default function LocationsPage(){
  const {language} = useLanguage();
  const text = COPY[language] || COPY.en;
  const [countries,setCountries] = useState([]);
  const [cities,setCities] = useState([]);
  const [types,setTypes] = useState([]);
  const [rows,setRows] = useState([]);
  const [countryId,setCountryId] = useState("");
  const [cityId,setCityId] = useState("");
  const [type,setType] = useState("");
  const [search,setSearch] = useState("");
  const [pickupOnly,setPickupOnly] = useState(false);
  const [dropoffOnly,setDropoffOnly] = useState(false);
  const [page,setPage] = useState(1);
  const [pageSize,setPageSize] = useState(20);
  const [loading,setLoading] = useState(false);
  const [selected,setSelected] = useState(null);
  const [focusTarget,setFocusTarget] = useState("");
  const [editorOpen,setEditorOpen] = useState(false);
  const [form,setForm] = useState(emptyLocation);
  const [formCities,setFormCities] = useState([]);
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState("");

  useEffect(()=>{
    Promise.all([getCountries(),getLocationTypes()]).then(([c,t])=>{setCountries(c);setTypes(t);});
  },[]);

  useEffect(()=>{
    let alive = true;
    if(!countryId){
      setCities([]);
      setCityId("");
      return undefined;
    }
    getCities(countryId).then((nextCities)=>{
      if(!alive) return;
      setCities(nextCities);
      setCityId((current)=> nextCities.some(x=>String(x.id)===String(current)) ? current : "");
    });
    return ()=>{alive=false;};
  },[countryId]);

  useEffect(()=>{
    if(!selected || !focusTarget) return undefined;
    const timer = window.setTimeout(()=>{
      const sections = Array.from(document.querySelectorAll(".lop-panel .lop-section"));
      const target = focusTarget === "setup" ? sections[2] : sections[3];
      if(target){
        target.scrollIntoView({behavior:"smooth",block:"start"});
        target.classList.add("lop-focus-pulse");
        window.setTimeout(()=>target.classList.remove("lop-focus-pulse"),1800);
      }
      setFocusTarget("");
    },180);
    return ()=>window.clearTimeout(timer);
  },[selected,focusTarget]);

  async function fetchScope(overrides = {}){
    setLoading(true);
    try{
      const nextRows = await getAllLocations({
        countryId: overrides.countryId !== undefined ? overrides.countryId : (countryId||undefined),
        cityId: overrides.cityId !== undefined ? overrides.cityId : (cityId||undefined),
        type: overrides.type !== undefined ? overrides.type : (type||undefined),
        search: overrides.search !== undefined ? overrides.search : (search.trim()||undefined),
        pickupOnly: overrides.pickupOnly !== undefined ? overrides.pickupOnly : pickupOnly,
        dropoffOnly: overrides.dropoffOnly !== undefined ? overrides.dropoffOnly : dropoffOnly,
      });
      setRows(nextRows);
      setPage(1);
      return nextRows;
    }finally{setLoading(false);}
  }

  useEffect(()=>{fetchScope();},[countryId,cityId,type,pickupOnly,dropoffOnly]);

  const summary = useMemo(()=>({
    countries:countries.length,
    cities:new Set(rows.map(x=>x.city_id).filter(Boolean)).size,
    locations:rows.length,
    airports:rows.filter(x=>String(x.type?.code||"").toLowerCase()==="airport").length,
  }),[countries,rows]);

  const lastPage=Math.max(1,Math.ceil(rows.length/pageSize));
  const safePage=Math.min(page,lastPage);
  const pageRows=rows.slice((safePage-1)*pageSize,safePage*pageSize);
  const from=rows.length?(safePage-1)*pageSize+1:0;
  const to=Math.min(safePage*pageSize,rows.length);

  async function openDetails(id, target=""){
    const fresh = await getLocation(id);
    setSelected(fresh);
    setFocusTarget(target);
  }

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
    setForm(v=>({...v,country_id:value,city_id:nextCities[0]?.id||"",timezone:country?.default_timezone||""}));
  }

  async function applyAirport(airport){
    const airportType = types.find(x=>x.code==="airport");
    const nextCities = airport.country_id ? await getCities(airport.country_id) : [];
    setFormCities(nextCities);
    setForm(v=>({...v,
      country_id:String(airport.country_id||v.country_id),
      city_id:String(airport.city_id||v.city_id),
      location_type_id:airportType?.id||v.location_type_id,
      name:airport.name||v.name,
      code:airport.iata_code||airport.icao_code||v.code,
      iata_code:airport.iata_code||"",
      icao_code:airport.icao_code||"",
      timezone:airport.timezone||airport.city?.timezone||airport.country?.default_timezone||v.timezone,
      latitude:airport.latitude??v.latitude,
      longitude:airport.longitude??v.longitude,
      geofence_radius_meters:v.geofence_radius_meters||1500,
      terminals:Array.isArray(airport.terminals)?airport.terminals.map(t=>({name:t.name,code:t.code||"",type:t.type||"mixed"})):v.terminals,
    }));
  }

  function addTerminal(){patch("terminals",[...form.terminals,{name:"",code:"",type:"mixed"}]);}
  function patchTerminal(i,key,value){patch("terminals",form.terminals.map((t,n)=>n===i?{...t,[key]:value}:t));}

  async function saveLocation(e){
    e.preventDefault();
    setBusy(true);
    setNotice("");
    try{
      const payload = {...form,
        country_id:Number(form.country_id),
        city_id:Number(form.city_id),
        location_type_id:Number(form.location_type_id),
        latitude:form.latitude||null,
        longitude:form.longitude||null,
        geofence_radius_meters:form.geofence_radius_meters||null,
      };
      const created = await createLocation(payload);

      setEditorOpen(false);
      setNotice(text.saved);
      setSearch("");
      setPickupOnly(false);
      setDropoffOnly(false);
      setCountryId("");
      setCities([]);
      setCityId("");
      setType("");
      await fetchScope({countryId:undefined,cityId:undefined,type:undefined,search:"",pickupOnly:false,dropoffOnly:false});

      if(created?.id){
        const fresh = await getLocation(created.id);
        if(fresh) setSelected(fresh);
      }
    }catch(err){
      setNotice(err?.response?.data?.message || err?.message || text.error);
    }finally{
      setBusy(false);
    }
  }

  return <main className="location-control-page">
    <header className="location-control-header">
      <div><span>{text.eyebrow}</span><h1>{text.title}</h1><p>{text.description}</p></div>
      <div className="location-header-actions"><button type="button" onClick={()=>fetchScope()}>↻ {text.refresh}</button><button className="primary" type="button" disabled={!countries.length} onClick={openAdd}>+ {text.add}</button></div>
    </header>

    {notice&&<div className="location-notice">{notice}</div>}

    <section className="location-kpis">
      <Kpi label={text.countries} value={summary.countries} icon="🌍"/>
      <Kpi label={text.cities} value={summary.cities} icon="🏙️"/>
      <Kpi label={text.locations} value={summary.locations} icon="📍"/>
      <Kpi label={text.airports} value={summary.airports} icon="✈️"/>
    </section>

    <section className="location-workspace">
      <div className="location-filters">
        <select value={countryId} onChange={e=>setCountryId(e.target.value)}><option value="">{text.selectCountry}</option>{countries.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
        <select value={cityId} disabled={!countryId} onChange={e=>setCityId(e.target.value)}><option value="">{text.selectCity}</option>{cities.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
        <select value={type} onChange={e=>setType(e.target.value)}><option value="">{text.allTypes}</option>{types.map(x=><option key={x.id} value={x.code}>{x.name}</option>)}</select>
        <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&fetchScope()} placeholder={text.search}/>
        <button type="button" onClick={()=>fetchScope()}>⌕</button>
      </div>

      <div className="location-toggle-row">
        <label><input type="checkbox" checked={pickupOnly} onChange={e=>setPickupOnly(e.target.checked)}/>{text.pickupOnly}</label>
        <label><input type="checkbox" checked={dropoffOnly} onChange={e=>setDropoffOnly(e.target.checked)}/>{text.dropoffOnly}</label>
      </div>

      {loading ? <div className="location-empty">{text.loading}</div> : pageRows.length ?
        <div className="location-table-wrap airport-operations-table"><table><thead><tr><th>{text.name}</th><th>{text.scope}</th><th>{text.codes}</th><th>{text.operations}</th><th>{text.coverage}</th><th>{text.status}</th><th>{text.details}</th></tr></thead><tbody>{pageRows.map(item=><AirportOperationRow key={item.id} item={item} text={text} onDetails={openDetails}/>)}</tbody></table></div>
        : <div className="location-empty">{text.noRows}</div>}

      <div className="location-pagination"><span>{text.showing} <strong>{from}-{to}</strong> {text.of} <strong>{rows.length}</strong></span><div><button disabled={safePage<=1} onClick={()=>setPage(safePage-1)}>‹ {text.previous}</button><span>{text.page} {safePage} / {lastPage}</span><button disabled={safePage>=lastPage} onClick={()=>setPage(safePage+1)}>{text.next} ›</button></div><label><select value={pageSize} onChange={e=>{setPageSize(Number(e.target.value));setPage(1);}}>{PAGE_SIZES.map(s=><option key={s}>{s}</option>)}</select><span>{text.perPage}</span></label></div>
    </section>

    {editorOpen&&<div className="location-detail-backdrop"><aside className="location-detail-panel location-editor"><header><div><span>{text.eyebrow}</span><h2>{text.newLocation}</h2></div><button onClick={()=>setEditorOpen(false)}>× {text.cancel}</button></header><form onSubmit={saveLocation} className="location-form-grid">
      <Field label={language==="tr"?"Ülke seçin":"Select country"}><select required value={form.country_id} onChange={e=>changeFormCountry(e.target.value)}><option value="">{language==="tr"?"Ülke seçin":"Select country"}</option>{countries.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
      <Field label={language==="tr"?"Şehir seçin":"Select city"}><select required value={form.city_id} onChange={e=>patch("city_id",e.target.value)}><option value="">{language==="tr"?"Şehir seçin":"Select city"}</option>{formCities.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
      <Field label={text.type}><select required value={form.location_type_id} onChange={e=>patch("location_type_id",e.target.value)}>{types.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
      {selectedType?.code==="airport"&&<div className="location-airport-finder"><AirportFinder language={language} onSelect={applyAirport}/></div>}
      <Field label={text.locationName}><input required value={form.name} onChange={e=>patch("name",e.target.value)}/></Field>
      <Field label={text.nativeName}><input value={form.native_name} onChange={e=>patch("native_name",e.target.value)}/></Field>
      <Field label={text.locationCode}><input value={form.code} onChange={e=>patch("code",e.target.value)}/></Field>
      <Field label={text.timezone}><input value={form.timezone} onChange={e=>patch("timezone",e.target.value)}/></Field>
      {selectedType?.code==="airport"&&<><Field label={text.iata}><input maxLength="3" value={form.iata_code} onChange={e=>patch("iata_code",e.target.value.toUpperCase())}/></Field><Field label={text.icao}><input maxLength="4" value={form.icao_code} onChange={e=>patch("icao_code",e.target.value.toUpperCase())}/></Field></>}
      <Field label={text.address} wide><textarea value={form.address} onChange={e=>patch("address",e.target.value)}/></Field>
      <Field label={text.latitude}><input type="number" step="any" value={form.latitude} onChange={e=>patch("latitude",e.target.value)}/></Field>
      <Field label={text.longitude}><input type="number" step="any" value={form.longitude} onChange={e=>patch("longitude",e.target.value)}/></Field>
      <Field label={text.radius}><input type="number" min="0" value={form.geofence_radius_meters} onChange={e=>patch("geofence_radius_meters",e.target.value)}/></Field>
      {selectedType?.code==="airport"&&<div className="location-terminal-editor"><div className="section-title"><strong>{text.terminals}</strong><button type="button" onClick={addTerminal}>+ {text.addTerminal}</button></div>{form.terminals.length?form.terminals.map((t,i)=><div className="terminal-row" key={i}><input placeholder={text.terminalName} value={t.name} onChange={e=>patchTerminal(i,"name",e.target.value)}/><input placeholder={text.terminalCode} value={t.code} onChange={e=>patchTerminal(i,"code",e.target.value)}/><button type="button" onClick={()=>patch("terminals",form.terminals.filter((_,n)=>n!==i))}>{text.remove}</button></div>):<div className="location-inline-empty">{text.noTerminals}</div>}</div>}
      <div className="location-form-checks"><label><input type="checkbox" checked={form.is_public} onChange={e=>patch("is_public",e.target.checked)}/>{text.public}</label><label><input type="checkbox" checked={form.is_active} onChange={e=>patch("is_active",e.target.checked)}/>{text.active}</label></div>
      <button className="location-save" disabled={busy}>{busy?"…":text.save}</button>
    </form></aside></div>}

    {selected&&<ProfessionalLocationOperationsPanel initialLocation={selected} language={language} onClose={()=>{setSelected(null);setFocusTarget("");}} onChanged={(fresh)=>{setSelected(fresh);fetchScope();}}/>}
  </main>;
}

function AirportOperationRow({item,text,onDetails}){
  const terminals = Number(item.airport?.terminals_count || 0);
  const pickup = Number(item.pickup_points_count || 0);
  const dropoff = Number(item.dropoff_points_count || 0);
  const meet = Number(item.meet_greet_points_count || 0);
  const totalPoints = Number(item.operational_points_count || 0);
  const mappedPoints = Number(item.mapped_points_count || 0);
  const isAirport = String(item.type?.code || "").toLowerCase() === "airport";
  const setupComplete = !isAirport || terminals > 0;
  const mapComplete = totalPoints > 0 && mappedPoints >= totalPoints;
  const readiness = !setupComplete || totalPoints === 0
    ? {label:text.setup,className:"is-setup",target:"setup"}
    : mapComplete
      ? {label:text.ready,className:"is-ready",target:""}
      : {label:text.needsMap,className:"is-warning",target:"points"};

  return <tr>
    <td className="location-name-cell"><div className="location-kind-icon">{isAirport?"✈":"●"}</div><div><strong>{item.name}</strong><small>{item.type?.name || "—"}{item.timezone?` · ${item.timezone}`:""}</small></div></td>
    <td><strong>{item.country?.name||"—"}</strong><small>{item.city?.name||"—"}</small></td>
    <td><div className="location-code-stack"><b>{item.airport?.iata_code||item.code||"—"}</b>{item.airport?.icao_code&&<span>{item.airport.icao_code}</span>}</div></td>
    <td><div className="location-operation-badges"><span title="Terminals">{text.terminalsShort} <b>{terminals}</b></span><span title="Pickup">{text.pickupShort} <b>{pickup}</b></span><span title="Dropoff">{text.dropoffShort} <b>{dropoff}</b></span><span title="Meet & Greet">{text.meetShort} <b>{meet}</b></span></div></td>
    <td><div className="location-coverage-cell"><strong>{totalPoints?`${mappedPoints}/${totalPoints} ${text.mapped}`:text.noPoints}</strong><small>{item.geofence_radius_meters?`Geofence ${item.geofence_radius_meters} m`:"Geofence —"}</small></div></td>
    <td><div className="location-status-stack"><button type="button" className={`location-readiness-status location-readiness-action ${readiness.className}`} onClick={()=>onDetails(item.id,readiness.target)}>{readiness.label}</button><span className={`location-status ${item.is_active?"is-active":"is-inactive"}`}>{item.is_active?text.active:text.inactive}</span></div></td>
    <td><button className="location-details-button" onClick={()=>onDetails(item.id)}>{text.details}</button></td>
  </tr>;
}

function Kpi({label,value,icon}){return <article className="location-kpi"><div>{icon}</div><span>{label}</span><strong>{value}</strong></article>;}
function Field({label,children,wide=false}){return <label className={wide?"wide":""}><span>{label}</span>{children}</label>;}

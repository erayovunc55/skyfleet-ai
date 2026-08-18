import { useMemo, useState } from "react";
import { createLocationPoint, getLocation, updateLocation } from "../../services/locationService";
import "../../styles/modules/location-operations-panel.css";

const POINT_TYPES = [
  "meeting_point","pickup_point","dropoff_point","entrance","exit","gate","lobby","reception","parking","platform","dock","custom",
];

const COPY = {
  en: {
    title:"Location Operations Center", close:"Close", overview:"Overview", airportIdentity:"Airport Identity", operationalReadiness:"Operational Readiness",
    terminals:"Airport Terminals", addTerminal:"Add Terminal", terminalName:"Terminal name", terminalCode:"Code", terminalType:"Type", saveTerminals:"Save Terminals",
    pickupPoints:"Pickup Points", dropoffPoints:"Dropoff Points", meetGreet:"Meet & Greet", points:"Operational Points", addPoint:"Add Point",
    pointName:"Point name", pointType:"Point type", terminal:"Terminal", noTerminal:"No terminal", latitude:"Latitude", longitude:"Longitude", radius:"Geofence radius (m)",
    instructions:"Driver / meeting instructions", pickup:"Pickup", dropoff:"Dropoff", requiresMeet:"Meet & greet required", savePoint:"Save Point", cancel:"Cancel",
    locationType:"Location Type", scope:"Country / City", timezone:"Timezone", coordinates:"Coordinates", geofence:"Location Geofence", address:"Address",
    noTerminals:"No terminals registered yet.", noPoints:"No operational pickup/dropoff points registered yet.", active:"Active", inactive:"Inactive",
    terminalSaved:"Terminal structure saved.", pointSaved:"Operational point saved.", meters:"m", passenger:"Passenger",
  },
  tr: {
    title:"Lokasyon Operasyon Merkezi", close:"Kapat", overview:"Genel Bakış", airportIdentity:"Havalimanı Kimliği", operationalReadiness:"Operasyon Hazırlığı",
    terminals:"Havalimanı Terminalleri", addTerminal:"Terminal Ekle", terminalName:"Terminal adı", terminalCode:"Kod", terminalType:"Tür", saveTerminals:"Terminalleri Kaydet",
    pickupPoints:"Pickup Noktaları", dropoffPoints:"Dropoff Noktaları", meetGreet:"Karşılama", points:"Operasyon Noktaları", addPoint:"Nokta Ekle",
    pointName:"Nokta adı", pointType:"Nokta türü", terminal:"Terminal", noTerminal:"Terminal yok", latitude:"Enlem", longitude:"Boylam", radius:"Geofence yarıçapı (m)",
    instructions:"Sürücü / karşılama talimatı", pickup:"Pickup", dropoff:"Dropoff", requiresMeet:"Karşılama gerekli", savePoint:"Noktayı Kaydet", cancel:"İptal",
    locationType:"Lokasyon Türü", scope:"Ülke / Şehir", timezone:"Saat Dilimi", coordinates:"Koordinatlar", geofence:"Lokasyon Geofence", address:"Adres",
    noTerminals:"Henüz terminal kaydı yok.", noPoints:"Henüz operasyon pickup/dropoff noktası yok.", active:"Aktif", inactive:"Pasif",
    terminalSaved:"Terminal yapısı kaydedildi.", pointSaved:"Operasyon noktası kaydedildi.", meters:"m", passenger:"Yolcu",
  },
};
COPY.ar = {...COPY.en,title:"مركز عمليات الموقع",close:"إغلاق",terminals:"محطات المطار",addTerminal:"إضافة محطة",points:"نقاط التشغيل",addPoint:"إضافة نقطة"};
COPY.es = {...COPY.en,title:"Centro de Operaciones de Ubicación",close:"Cerrar",terminals:"Terminales del Aeropuerto",addTerminal:"Añadir terminal",points:"Puntos Operativos",addPoint:"Añadir punto"};

const emptyPoint = {
  name:"", code:"", point_type:"meeting_point", airport_terminal_id:"", instructions:"", latitude:"", longitude:"", geofence_radius_meters:"",
  is_pickup_allowed:true, is_dropoff_allowed:false, requires_meet_and_greet:false,
};

export default function ProfessionalLocationOperationsPanel({ initialLocation, language="en", onClose, onChanged }) {
  const text = COPY[language] || COPY.en;
  const [location, setLocation] = useState(initialLocation);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [pointOpen, setPointOpen] = useState(false);
  const [terminals, setTerminals] = useState(() => (initialLocation.airport?.terminals || []).map(t => ({name:t.name, code:t.code||"", type:t.type||"passenger"})));
  const [pointForm, setPointForm] = useState(emptyPoint);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const points = location.points || [];
  const stats = useMemo(() => ({
    terminals: location.airport?.terminals?.length || 0,
    pickup: points.filter(p=>p.is_pickup_allowed).length,
    dropoff: points.filter(p=>p.is_dropoff_allowed).length,
    meet: points.filter(p=>p.requires_meet_and_greet).length,
  }), [location]);

  async function reload(message="") {
    const fresh = await getLocation(location.id);
    setLocation(fresh);
    setTerminals((fresh.airport?.terminals || []).map(t=>({name:t.name,code:t.code||"",type:t.type||"passenger"})));
    setNotice(message);
    onChanged?.(fresh);
  }

  function addTerminal() {
    setTerminals(v=>[...v,{name:"",code:"",type:"passenger"}]);
    setTerminalOpen(true);
  }

  function patchTerminal(index, key, value) {
    setTerminals(v=>v.map((item,i)=>i===index?{...item,[key]:value}:item));
  }

  async function saveTerminals() {
    setBusy(true); setNotice("");
    try {
      await updateLocation(location.id, {
        country_id: location.country_id,
        city_id: location.city_id,
        location_type_id: location.location_type_id,
        name: location.name,
        native_name: location.native_name || null,
        code: location.code || null,
        address: location.address || null,
        timezone: location.timezone || location.airport?.timezone || null,
        latitude: location.latitude,
        longitude: location.longitude,
        geofence_radius_meters: location.geofence_radius_meters,
        is_public: location.is_public,
        is_active: location.is_active,
        iata_code: location.airport?.iata_code || location.code || null,
        icao_code: location.airport?.icao_code || null,
        terminals: terminals.filter(t=>t.name.trim()),
      });
      await reload(text.terminalSaved);
      setTerminalOpen(false);
    } catch (error) {
      setNotice(error?.response?.data?.message || error?.message || "Operation failed.");
    } finally { setBusy(false); }
  }

  async function savePoint(event) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      await createLocationPoint(location.id, {
        ...pointForm,
        airport_terminal_id: pointForm.airport_terminal_id ? Number(pointForm.airport_terminal_id) : null,
        latitude: pointForm.latitude || null,
        longitude: pointForm.longitude || null,
        geofence_radius_meters: pointForm.geofence_radius_meters || null,
      });
      setPointForm(emptyPoint);
      setPointOpen(false);
      await reload(text.pointSaved);
    } catch (error) {
      setNotice(error?.response?.data?.message || error?.message || "Operation failed.");
    } finally { setBusy(false); }
  }

  const airport = location.airport;
  const airportTerminals = airport?.terminals || [];

  return <div className="lop-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
    <aside className="lop-panel">
      <header className="lop-header">
        <div><span>{text.title}</span><h2>{location.name}</h2><p>{location.city?.name || "—"}, {location.country?.name || "—"}</p></div>
        <button onClick={onClose}>× {text.close}</button>
      </header>

      {notice && <div className="lop-notice">{notice}</div>}

      <section className="lop-identity">
        <div className="lop-plane">✈</div>
        <div><span>{text.airportIdentity}</span><strong>{airport?.iata_code || location.code || "—"}</strong><small>{airport?.icao_code || location.type?.name || "—"}</small></div>
        <b className={location.is_active?"active":"inactive"}>{location.is_active?text.active:text.inactive}</b>
      </section>

      <section className="lop-section">
        <div className="lop-section-title"><div><span>{text.operationalReadiness}</span><h3>{text.overview}</h3></div></div>
        <div className="lop-stats">
          <Stat label={text.terminals} value={stats.terminals}/><Stat label={text.pickupPoints} value={stats.pickup}/><Stat label={text.dropoffPoints} value={stats.dropoff}/><Stat label={text.meetGreet} value={stats.meet}/>
        </div>
        <div className="lop-overview-grid">
          <Info label={text.locationType} value={location.type?.name}/><Info label={text.scope} value={`${location.country?.name||"—"} / ${location.city?.name||"—"}`}/>
          <Info label={text.timezone} value={location.timezone || airport?.timezone}/><Info label={text.coordinates} value={location.latitude&&location.longitude?`${location.latitude}, ${location.longitude}`:null}/>
          <Info label={text.geofence} value={location.geofence_radius_meters?`${location.geofence_radius_meters} ${text.meters}`:null}/><Info label={text.address} value={location.address}/>
        </div>
      </section>

      {airport && <section className="lop-section">
        <div className="lop-section-title"><div><span>{text.airportIdentity}</span><h3>{text.terminals}</h3></div><button onClick={()=>setTerminalOpen(v=>!v)}>+ {text.addTerminal}</button></div>
        {terminalOpen && <div className="lop-terminal-editor">
          {terminals.map((terminal,index)=><div className="lop-terminal-row" key={index}>
            <input placeholder={text.terminalName} value={terminal.name} onChange={e=>patchTerminal(index,"name",e.target.value)}/>
            <input placeholder={text.terminalCode} value={terminal.code} onChange={e=>patchTerminal(index,"code",e.target.value)}/>
            <select value={terminal.type} onChange={e=>patchTerminal(index,"type",e.target.value)}><option value="passenger">{text.passenger}</option><option value="domestic">Domestic</option><option value="international">International</option><option value="general">General</option></select>
            <button className="danger" onClick={()=>setTerminals(v=>v.filter((_,i)=>i!==index))}>×</button>
          </div>)}
          <div className="lop-editor-actions"><button onClick={()=>setTerminalOpen(false)}>{text.cancel}</button><button className="primary" disabled={busy} onClick={saveTerminals}>{text.saveTerminals}</button></div>
        </div>}
        {airportTerminals.length ? <div className="lop-terminal-cards">{airportTerminals.map(t=><article key={t.id}><div><strong>{t.name}</strong><span>{t.type || text.passenger}</span></div><b>{t.code || "—"}</b></article>)}</div> : <div className="lop-empty">{text.noTerminals}</div>}
      </section>}

      <section className="lop-section">
        <div className="lop-section-title"><div><span>{text.operationalReadiness}</span><h3>{text.points}</h3></div><button onClick={()=>setPointOpen(v=>!v)}>+ {text.addPoint}</button></div>
        {pointOpen && <form className="lop-point-form" onSubmit={savePoint}>
          <input required placeholder={text.pointName} value={pointForm.name} onChange={e=>setPointForm(v=>({...v,name:e.target.value}))}/>
          <select value={pointForm.point_type} onChange={e=>setPointForm(v=>({...v,point_type:e.target.value}))}>{POINT_TYPES.map(type=><option key={type} value={type}>{type.replaceAll("_"," ")}</option>)}</select>
          <select value={pointForm.airport_terminal_id} onChange={e=>setPointForm(v=>({...v,airport_terminal_id:e.target.value}))}><option value="">{text.noTerminal}</option>{airportTerminals.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
          <input type="number" step="any" placeholder={text.latitude} value={pointForm.latitude} onChange={e=>setPointForm(v=>({...v,latitude:e.target.value}))}/>
          <input type="number" step="any" placeholder={text.longitude} value={pointForm.longitude} onChange={e=>setPointForm(v=>({...v,longitude:e.target.value}))}/>
          <input type="number" min="0" placeholder={text.radius} value={pointForm.geofence_radius_meters} onChange={e=>setPointForm(v=>({...v,geofence_radius_meters:e.target.value}))}/>
          <textarea placeholder={text.instructions} value={pointForm.instructions} onChange={e=>setPointForm(v=>({...v,instructions:e.target.value}))}/>
          <div className="lop-checks"><label><input type="checkbox" checked={pointForm.is_pickup_allowed} onChange={e=>setPointForm(v=>({...v,is_pickup_allowed:e.target.checked}))}/>{text.pickup}</label><label><input type="checkbox" checked={pointForm.is_dropoff_allowed} onChange={e=>setPointForm(v=>({...v,is_dropoff_allowed:e.target.checked}))}/>{text.dropoff}</label><label><input type="checkbox" checked={pointForm.requires_meet_and_greet} onChange={e=>setPointForm(v=>({...v,requires_meet_and_greet:e.target.checked}))}/>{text.requiresMeet}</label></div>
          <div className="lop-editor-actions"><button type="button" onClick={()=>setPointOpen(false)}>{text.cancel}</button><button className="primary" disabled={busy}>{text.savePoint}</button></div>
        </form>}
        {points.length ? <div className="lop-point-list">{points.map(point=><article key={point.id}>
          <div className="lop-point-icon">{point.is_pickup_allowed?"P":point.is_dropoff_allowed?"D":"•"}</div>
          <div className="lop-point-main"><strong>{point.name}</strong><span>{point.point_type?.replaceAll?.("_"," ") || point.point_type}</span><small>{point.airport_terminal?.name || text.noTerminal}</small>{point.instructions && <p>{point.instructions}</p>}</div>
          <div className="lop-point-meta">{point.is_pickup_allowed&&<b>Pickup</b>}{point.is_dropoff_allowed&&<b>Dropoff</b>}{point.requires_meet_and_greet&&<b>M&G</b>}{point.geofence_radius_meters&&<span>{point.geofence_radius_meters} m</span>}</div>
        </article>)}</div> : !pointOpen && <div className="lop-empty">{text.noPoints}</div>}
      </section>
    </aside>
  </div>;
}

function Stat({label,value}){return <article className="lop-stat"><span>{label}</span><strong>{value}</strong></article>}
function Info({label,value}){return <article className="lop-info"><span>{label}</span><strong>{value||"—"}</strong></article>}

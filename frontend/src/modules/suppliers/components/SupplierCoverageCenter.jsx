import { useEffect, useMemo, useState } from "react";
import { getAllLocations } from "../../../services/locationService";
import supplierService from "../services/supplierService";
import "../../../styles/modules/supplier-coverage.css";

const COPY={
  tr:{title:"Hizmet Bölgeleri",subtitle:"Tedarikçinin hizmet verdiği havalimanlarını ve operasyon kapsamını yönetin.",add:"Hizmet Bölgesi Ekle",airport:"Havalimanı / Lokasyon",radius:"Servis yarıçapı (m)",pickup:"Pickup",dropoff:"Dropoff",active:"Aktif",save:"Kapsama Ekle",empty:"Bu tedarikçi için henüz hizmet bölgesi tanımlanmadı.",loading:"Hizmet bölgeleri yükleniyor...",remove:"Kaldır",confirm:"Bu hizmet bölgesi kaldırılsın mı?",coverage:"Kapsam",status:"Durum",operational:"Operasyonel",closed:"Kapalı",select:"Havalimanı seçin",duplicate:"Bu havalimanı zaten tedarikçinin hizmet alanında.",saved:"Hizmet bölgesi eklendi.",updated:"Hizmet bölgesi güncellendi.",deleted:"Hizmet bölgesi kaldırıldı.",error:"İşlem tamamlanamadı.",airports:"Havalimanı",countries:"Ülke",cities:"Şehir"},
  en:{title:"Service Coverage",subtitle:"Manage the airports and operating scope served by this supplier.",add:"Add Service Area",airport:"Airport / Location",radius:"Service radius (m)",pickup:"Pickup",dropoff:"Dropoff",active:"Active",save:"Add Coverage",empty:"No service coverage has been configured for this supplier yet.",loading:"Loading service coverage...",remove:"Remove",confirm:"Remove this service coverage?",coverage:"Coverage",status:"Status",operational:"Operational",closed:"Closed",select:"Select airport",duplicate:"This airport is already covered by the supplier.",saved:"Service coverage added.",updated:"Service coverage updated.",deleted:"Service coverage removed.",error:"Operation failed.",airports:"Airport",countries:"Country",cities:"City"}
};
COPY.ar={...COPY.en,title:"نطاق الخدمة",add:"إضافة منطقة خدمة",remove:"إزالة"};
COPY.es={...COPY.en,title:"Cobertura de Servicio",add:"Añadir Área de Servicio",remove:"Eliminar"};

export default function SupplierCoverageCenter({supplierId,language="en"}){
  const text=COPY[language]||COPY.en;
  const [rows,setRows]=useState([]);
  const [locations,setLocations]=useState([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");
  const [form,setForm]=useState({location_id:"",service_radius_meters:15000,pickup_enabled:true,dropoff_enabled:true,is_active:true});

  async function load(){
    setLoading(true);
    try{
      const [coverageRows,airportRows]=await Promise.all([
        supplierService.getCoverages(supplierId),
        getAllLocations({type:"airport"}),
      ]);
      setRows(coverageRows);
      setLocations(airportRows);
    }catch(error){setNotice(error?.response?.data?.message||error?.message||text.error)}
    finally{setLoading(false)}
  }

  useEffect(()=>{load()},[supplierId]);

  const available=useMemo(()=>{
    const used=new Set(rows.map(x=>Number(x.location_id)));
    return locations.filter(x=>!used.has(Number(x.id)));
  },[rows,locations]);

  async function addCoverage(event){
    event.preventDefault();
    if(!form.location_id)return;
    if(rows.some(x=>Number(x.location_id)===Number(form.location_id))){setNotice(text.duplicate);return}
    setBusy(true);setNotice("");
    try{
      await supplierService.addCoverage(supplierId,{...form,location_id:Number(form.location_id),service_radius_meters:form.service_radius_meters?Number(form.service_radius_meters):null,coverage_type:"airport"});
      setForm({location_id:"",service_radius_meters:15000,pickup_enabled:true,dropoff_enabled:true,is_active:true});
      await load();setNotice(text.saved);
    }catch(error){setNotice(error?.response?.data?.message||error?.message||text.error)}finally{setBusy(false)}
  }

  async function patch(row,key,value){
    setBusy(true);setNotice("");
    try{
      await supplierService.updateCoverage(supplierId,row.id,{[key]:value});
      await load();setNotice(text.updated);
    }catch(error){setNotice(error?.response?.data?.message||error?.message||text.error)}finally{setBusy(false)}
  }

  async function remove(row){
    if(!window.confirm(text.confirm))return;
    setBusy(true);setNotice("");
    try{await supplierService.deleteCoverage(supplierId,row.id);await load();setNotice(text.deleted)}catch(error){setNotice(error?.response?.data?.message||error?.message||text.error)}finally{setBusy(false)}
  }

  return <div className="supplier-coverage-center">
    <section className="supplier-coverage-head">
      <div><span>SUPPLIER NETWORK</span><h3>{text.title}</h3><p>{text.subtitle}</p></div>
      <div className="supplier-coverage-kpi"><span>{text.airports}</span><strong>{rows.filter(x=>x.is_active).length}</strong></div>
    </section>

    {notice&&<div className="supplier-coverage-notice">{notice}</div>}

    <form className="supplier-coverage-form" onSubmit={addCoverage}>
      <label><span>{text.airport}</span><select required value={form.location_id} onChange={e=>setForm(v=>({...v,location_id:e.target.value}))}><option value="">{text.select}</option>{available.map(x=><option key={x.id} value={x.id}>{x.airport?.iata_code||x.code||"—"} · {x.name} · {x.city?.name||"—"}, {x.country?.name||"—"}</option>)}</select></label>
      <label><span>{text.radius}</span><input type="number" min="0" max="500000" value={form.service_radius_meters} onChange={e=>setForm(v=>({...v,service_radius_meters:e.target.value}))}/></label>
      <div className="supplier-coverage-checks"><label><input type="checkbox" checked={form.pickup_enabled} onChange={e=>setForm(v=>({...v,pickup_enabled:e.target.checked}))}/>{text.pickup}</label><label><input type="checkbox" checked={form.dropoff_enabled} onChange={e=>setForm(v=>({...v,dropoff_enabled:e.target.checked}))}/>{text.dropoff}</label></div>
      <button className="primary" disabled={busy||!available.length}>{busy?"…":`+ ${text.save}`}</button>
    </form>

    {loading?<div className="supplier-coverage-empty">{text.loading}</div>:rows.length?<div className="supplier-coverage-list">{rows.map(row=><article key={row.id} className={!row.is_active?"is-disabled":""}>
      <div className="supplier-coverage-code">{row.location?.code||"LOC"}</div>
      <div className="supplier-coverage-main"><strong>{row.label||row.location?.name||"Location"}</strong><span>{row.city?.name||"—"}, {row.country?.name||"—"}</span><small>{row.service_radius_meters?`${Math.round(row.service_radius_meters/1000)} km ${text.coverage}`:"—"}</small></div>
      <div className="supplier-coverage-flags"><label><input type="checkbox" checked={Boolean(row.pickup_enabled)} disabled={busy} onChange={e=>patch(row,"pickup_enabled",e.target.checked)}/>{text.pickup}</label><label><input type="checkbox" checked={Boolean(row.dropoff_enabled)} disabled={busy} onChange={e=>patch(row,"dropoff_enabled",e.target.checked)}/>{text.dropoff}</label></div>
      <div className="supplier-coverage-state"><button type="button" className={row.is_active?"is-active":"is-closed"} disabled={busy} onClick={()=>patch(row,"is_active",!row.is_active)}>{row.is_active?text.operational:text.closed}</button><button type="button" className="danger" disabled={busy} onClick={()=>remove(row)}>{text.remove}</button></div>
    </article>)}</div>:<div className="supplier-coverage-empty">{text.empty}</div>}
  </div>;
}
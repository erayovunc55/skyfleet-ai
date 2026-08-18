import { useEffect, useState } from "react";
import supplierService from "../services/supplierService";
import "../../../styles/modules/supplier-activity.css";

const PAGE_SIZES=[20,50,100];
const TYPES=["","supplier","document","driver","vehicle","transfer"];

export default function SupplierActivityCenter({supplierId,language}){
  const [data,setData]=useState({data:[],meta:{current_page:1,last_page:1,total:0}});
  const [search,setSearch]=useState("");
  const [type,setType]=useState("");
  const [page,setPage]=useState(1);
  const [size,setSize]=useState(20);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  const load=async(nextPage=page)=>{setLoading(true);setError("");try{setData(await supplierService.getActivity(supplierId,{search:search||undefined,type:type||undefined,page:nextPage,per_page:size}));}catch(e){setError(e?.response?.data?.message||e?.message||copy(language,"Activity could not be loaded.","Aktivite kayıtları yüklenemedi.","تعذر تحميل سجل النشاط.","No se pudo cargar la actividad."));}finally{setLoading(false);}};
  useEffect(()=>{setPage(1);load(1)},[supplierId,type,size]);

  const meta=data.meta||{};
  return <div className="supplier-activity-workspace">
    <div className="supplier-activity-toolbar">
      <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load(1)} placeholder={copy(language,"Search activity, booking, document or person...","Aktivite, rezervasyon, belge veya kişi ara...","ابحث في النشاط أو الحجز أو المستند أو الشخص...","Buscar actividad, reserva, documento o persona...")}/>
      <select value={type} onChange={e=>setType(e.target.value)}>{TYPES.map(v=><option key={v||"all"} value={v}>{v?typeLabel(v,language):copy(language,"All activity","Tüm aktiviteler","كل الأنشطة","Toda la actividad")}</option>)}</select>
      <button onClick={()=>{setPage(1);load(1)}}>{copy(language,"Search","Ara","بحث","Buscar")}</button>
    </div>

    {loading?<div className="supplier-detail-state compact">{copy(language,"Loading activity...","Aktiviteler yükleniyor...","جارٍ تحميل النشاط...","Cargando actividad...")}</div>:error?<div className="supplier-detail-state error">{error}</div>:data.data?.length?<div className="supplier-activity-feed">{data.data.map(item=><article className={`supplier-activity-item type-${item.category}`} key={item.id}><div className="supplier-activity-icon">{icon(item.category)}</div><div className="supplier-activity-content"><div className="supplier-activity-head"><strong>{eventTitle(item,language)}</strong><time>{formatDate(item.occurred_at,language)}</time></div><p>{item.description||"—"}</p><div className="supplier-activity-meta"><span>{typeLabel(item.category,language)}</span>{item.actor&&<span>{copy(language,"By","İşlemi yapan","بواسطة","Por")}: {item.actor}</span>}{item.metadata?.new_status&&<span>{item.metadata.old_status?`${item.metadata.old_status} → `:""}{item.metadata.new_status}</span>}{item.metadata?.status&&<span>{item.metadata.status}</span>}</div></div></article>)}</div>:<div className="supplier-detail-state">{copy(language,"No activity records yet.","Henüz aktivite kaydı yok.","لا توجد سجلات نشاط بعد.","Aún no hay registros de actividad.")}</div>}

    <div className="supplier-operation-pagination"><div>{meta.total||0} {copy(language,"records","kayıt","سجل","registros")}</div><div><button disabled={(meta.current_page||1)<=1} onClick={()=>{const p=(meta.current_page||1)-1;setPage(p);load(p)}}>‹</button><span>{meta.current_page||1} / {meta.last_page||1}</span><button disabled={(meta.current_page||1)>=(meta.last_page||1)} onClick={()=>{const p=(meta.current_page||1)+1;setPage(p);load(p)}}>›</button></div><label><select value={size} onChange={e=>setSize(Number(e.target.value))}>{PAGE_SIZES.map(v=><option key={v}>{v}</option>)}</select><span>{copy(language,"per page","sayfa başına","لكل صفحة","por página")}</span></label></div>
  </div>;
}

function eventTitle(item,l){if(item.type==="document_uploaded")return copy(l,"Document uploaded","Belge yüklendi","تم رفع مستند","Documento subido")+`: ${item.title}`;if(item.type==="driver_linked")return copy(l,"Driver linked","Sürücü bağlandı","تم ربط السائق","Conductor vinculado")+`: ${item.title}`;if(item.type==="vehicle_linked")return copy(l,"Vehicle linked","Araç bağlandı","تم ربط المركبة","Vehículo vinculado")+`: ${item.title}`;if(item.type==="transfer_linked")return copy(l,"Transfer linked","Transfer bağlandı","تم ربط الرحلة","Traslado vinculado")+`: ${item.title}`;return humanize(item.type||item.title)}
function typeLabel(v,l){const m={supplier:["Supplier","Tedarikçi","المورد","Proveedor"],document:["Document","Belge","مستند","Documento"],driver:["Driver","Sürücü","السائق","Conductor"],vehicle:["Vehicle","Araç","المركبة","Vehículo"],transfer:["Transfer","Transfer","الرحلة","Traslado"]};return copy(l,...(m[v]||[v,v,v,v]))}
function icon(v){return v==="document"?"📄":v==="driver"?"👤":v==="vehicle"?"🚐":v==="transfer"?"↗":"✓"}
function humanize(v){return String(v||"").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}
function copy(l,en,tr,ar,es){return l==="tr"?tr:l==="ar"?ar:l==="es"?es:en}
function formatDate(v,l){if(!v)return"—";const d=new Date(v);if(Number.isNaN(d.getTime()))return v;const locale=l==="tr"?"tr-TR":l==="ar"?"ar-SA":l==="es"?"es-ES":"en-GB";return d.toLocaleString(locale,{dateStyle:"medium",timeStyle:"short"})}

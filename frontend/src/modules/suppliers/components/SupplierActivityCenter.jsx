import { useEffect, useState } from "react";
import supplierService from "../services/supplierService";
import "../../../styles/modules/supplier-activity.css";

const PAGE_SIZES=[20,50,100];
const TYPES=["","supplier","document","driver","vehicle","transfer","finance"];

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

    {loading?<div className="supplier-detail-state compact">{copy(language,"Loading activity...","Aktiviteler yükleniyor...","جارٍ تحميل النشاط...","Cargando actividad...")}</div>:error?<div className="supplier-detail-state error">{error}</div>:data.data?.length?<div className="supplier-activity-feed">{data.data.map(item=><article className={`supplier-activity-item type-${item.category}`} key={item.id}><div className="supplier-activity-icon">{icon(item.category)}</div><div className="supplier-activity-content"><div className="supplier-activity-head"><strong>{eventTitle(item,language)}</strong><time>{formatDate(item.occurred_at,language)}</time></div><p>{item.description||"—"}</p><div className="supplier-activity-meta"><span>{typeLabel(item.category,language)}</span>{item.actor&&<span>{copy(language,"By","İşlemi yapan","بواسطة","Por")}: {item.actor}</span>}{item.metadata?.new_status&&<span>{item.metadata.old_status?`${statusLabel(item.metadata.old_status,language)} → `:""}{statusLabel(item.metadata.new_status,language)}</span>}{item.metadata?.status&&<span>{statusLabel(item.metadata.status,language)}</span>}{item.category==="finance"&&item.metadata?.amount!=null&&<span>{Number(item.metadata.amount).toFixed(2)} {item.metadata.currency||""}</span>}{item.metadata?.payment_reference&&<span>{copy(language,"Ref","Ref","مرجع","Ref")}: {item.metadata.payment_reference}</span>}</div></div></article>)}</div>:<div className="supplier-detail-state">{copy(language,"No meaningful activity records yet.","Henüz anlamlı aktivite kaydı yok.","لا توجد سجلات نشاط مهمة بعد.","Aún no hay registros de actividad relevantes.")}</div>}

    <div className="supplier-operation-pagination"><div>{meta.total||0} {copy(language,"records","kayıt","سجل","registros")}</div><div><button disabled={(meta.current_page||1)<=1} onClick={()=>{const p=(meta.current_page||1)-1;setPage(p);load(p)}}>‹</button><span>{meta.current_page||1} / {meta.last_page||1}</span><button disabled={(meta.current_page||1)>=(meta.last_page||1)} onClick={()=>{const p=(meta.current_page||1)+1;setPage(p);load(p)}}>›</button></div><label><select value={size} onChange={e=>setSize(Number(e.target.value))}>{PAGE_SIZES.map(v=><option key={v}>{v}</option>)}</select><span>{copy(language,"per page","sayfa başına","لكل صفحة","por página")}</span></label></div>
  </div>;
}

function eventTitle(item,l){
  if(item.type==="document_uploaded")return copy(l,"Document uploaded","Belge yüklendi","تم رفع مستند","Documento subido")+`: ${item.title}`;
  if(item.type==="driver_linked")return copy(l,"Driver linked","Sürücü bağlandı","تم ربط السائق","Conductor vinculado")+`: ${item.title}`;
  if(item.type==="vehicle_linked")return copy(l,"Vehicle linked","Araç bağlandı","تم ربط المركبة","Vehículo vinculado")+`: ${item.title}`;
  if(item.type?.startsWith("transfer_"))return `${transferEventLabel(item.type.replace("transfer_",""),l)}: ${item.title}`;
  if(item.type?.startsWith("finance_"))return `${financeEventLabel(item.type.replace("finance_",""),l)}: ${item.title}`;
  return humanize(item.type||item.title);
}

function transferEventLabel(v,l){
  const m={accepted:["Transfer assigned","Transfer atandı","تم تعيين الرحلة","Traslado asignado"],on_the_way:["Driver en route","Sürücü yolda","السائق في الطريق","Conductor en ruta"],arrived:["Driver at pickup","Sürücü alış noktasında","السائق في نقطة الاستلام","Conductor en recogida"],passenger_called:["Passenger contacted","Yolcu arandı","تم الاتصال بالراكب","Pasajero contactado"],passenger_on_board:["Passenger on board","Yolcu araçta","الراكب في المركبة","Pasajero a bordo"],trip_started:["Transfer started","Transfer başladı","بدأت الرحلة","Traslado iniciado"],completed:["Transfer completed","Transfer tamamlandı","اكتملت الرحلة","Traslado completado"],no_show:["No Show recorded","No Show kaydedildi","تم تسجيل عدم الحضور","No Show registrado"],cancelled:["Transfer cancelled","Transfer iptal edildi","تم إلغاء الرحلة","Traslado cancelado"]};
  return copy(l,...(m[v]||[humanize(v),humanize(v),humanize(v),humanize(v)]));
}

function financeEventLabel(v,l){
  const m={approved:["Payment approved","Ödeme onaylandı","تم اعتماد الدفع","Pago aprobado"],paid:["Supplier paid","Tedarikçiye ödeme yapıldı","تم دفع مستحق المورد","Proveedor pagado"],disputed:["Payment disputed","Ödemeye itiraz edildi","تم الاعتراض على الدفع","Pago en disputa"],cancelled:["Financial record cancelled","Finans kaydı iptal edildi","تم إلغاء السجل المالي","Registro financiero cancelado"]};
  return copy(l,...(m[v]||[humanize(v),humanize(v),humanize(v),humanize(v)]));
}

function typeLabel(v,l){const m={supplier:["Supplier","Tedarikçi","المورد","Proveedor"],document:["Document","Belge","مستند","Documento"],driver:["Driver","Sürücü","السائق","Conductor"],vehicle:["Vehicle","Araç","المركبة","Vehículo"],transfer:["Transfer","Transfer","الرحلة","Traslado"],finance:["Finance","Finans","المالية","Finanzas"]};return copy(l,...(m[v]||[v,v,v,v]))}
function statusLabel(v,l){const m={pending:["Pending","Bekliyor","قيد الانتظار","Pendiente"],accepted:["Assigned","Atandı","تم التعيين","Asignado"],on_the_way:["En Route","Yolda","في الطريق","En ruta"],arrived:["At Pickup","Alış Noktasında","في نقطة الاستلام","En recogida"],passenger_called:["Passenger Called","Yolcu Arandı","تم الاتصال بالراكب","Pasajero contactado"],passenger_on_board:["Passenger On Board","Yolcu Araçta","الراكب في المركبة","Pasajero a bordo"],trip_started:["Trip Started","Transfer Başladı","بدأت الرحلة","Viaje iniciado"],completed:["Completed","Tamamlandı","مكتمل","Completado"],no_show:["No Show","No Show","عدم حضور","No Show"],cancelled:["Cancelled","İptal","ملغي","Cancelado"],approved:["Approved","Onaylandı","معتمد","Aprobado"],paid:["Paid","Ödendi","مدفوع","Pagado"],disputed:["Disputed","İtirazlı","متنازع عليه","En disputa"]};return copy(l,...(m[v]||[humanize(v),humanize(v),humanize(v),humanize(v)]))}
function icon(v){return v==="document"?"📄":v==="driver"?"👤":v==="vehicle"?"🚐":v==="transfer"?"↗":v==="finance"?"€":"✓"}
function humanize(v){return String(v||"").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}
function copy(l,en,tr,ar,es){return l==="tr"?tr:l==="ar"?ar:l==="es"?es:en}
function formatDate(v,l){if(!v)return"—";const d=new Date(v);if(Number.isNaN(d.getTime()))return v;const locale=l==="tr"?"tr-TR":l==="ar"?"ar-SA":l==="es"?"es-ES":"en-GB";return d.toLocaleString(locale,{dateStyle:"medium",timeStyle:"short"})}

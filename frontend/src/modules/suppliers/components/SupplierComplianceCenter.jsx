import { useEffect, useState } from "react";
import supplierService from "../services/supplierService";

const TYPES = ["contract","company_registration","tax_document","insurance","transport_license","tourism_license","other"];
const PAGE_SIZES = [20,50,100];

export default function SupplierComplianceCenter({ supplierId, text, language }) {
  const [data,setData]=useState({data:[],summary:{},meta:{current_page:1,last_page:1,total:0,per_page:20}});
  const [search,setSearch]=useState("");
  const [type,setType]=useState("");
  const [status,setStatus]=useState("");
  const [page,setPage]=useState(1);
  const [perPage,setPerPage]=useState(20);
  const [showForm,setShowForm]=useState(false);
  const [loading,setLoading]=useState(false);
  const [form,setForm]=useState({type:"contract",title:"",document_number:"",issued_at:"",expires_at:"",note:"",file:null});

  const load=async(nextPage=page)=>{
    setLoading(true);
    try{setData(await supplierService.getDocuments(supplierId,{search:search||undefined,type:type||undefined,status:status||undefined,page:nextPage,per_page:perPage}));}
    finally{setLoading(false);}
  };

  useEffect(()=>{setPage(1);load(1);},[supplierId,type,status,perPage]);

  const submit=async(e)=>{
    e.preventDefault();
    if(!form.file||!form.title)return;
    await supplierService.uploadDocument(supplierId,form);
    setForm({type:"contract",title:"",document_number:"",issued_at:"",expires_at:"",note:"",file:null});
    setShowForm(false);
    setPage(1);
    await load(1);
  };

  const remove=async(id)=>{await supplierService.deleteDocument(supplierId,id);await load(page);};
  const s=data.summary||{}; const meta=data.meta||{};

  return <div className="supplier-compliance-workspace">
    <div className="supplier-detail-kpis">
      <K label={label(language,"Total Documents","Toplam Belge","إجمالي المستندات","Documentos Totales")} value={s.total||0}/>
      <K label={label(language,"Expiring ≤60 Days","60 Gün İçinde Bitecek","تنتهي خلال 60 يومًا","Vencen en ≤60 días")} value={s.expiring||0}/>
      <K label={label(language,"Expired","Süresi Dolmuş","منتهي الصلاحية","Caducados")} value={s.expired||0}/>
      <K label={label(language,"No Expiry","Süresiz","بدون انتهاء","Sin caducidad")} value={s.no_expiry||0}/>
    </div>

    <div className="supplier-compliance-toolbar">
      <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load(1)} placeholder={label(language,"Search title or document number...","Belge adı veya numarası ara...","ابحث باسم أو رقم المستند...","Buscar título o número...")}/>
      <select value={type} onChange={e=>setType(e.target.value)}><option value="">{label(language,"All types","Tüm türler","كل الأنواع","Todos los tipos")}</option>{TYPES.map(v=><option key={v} value={v}>{typeLabel(v,language)}</option>)}</select>
      <select value={status} onChange={e=>setStatus(e.target.value)}><option value="">{label(language,"All statuses","Tüm durumlar","كل الحالات","Todos los estados")}</option><option value="valid">{statusLabel("valid",language)}</option><option value="expiring">{statusLabel("expiring",language)}</option><option value="expired">{statusLabel("expired",language)}</option><option value="no_expiry">{statusLabel("no_expiry",language)}</option></select>
      <button type="button" onClick={()=>load(1)}>{label(language,"Search","Ara","بحث","Buscar")}</button>
      <button type="button" className="primary" onClick={()=>setShowForm(v=>!v)}>+ {label(language,"Add Document","Belge Ekle","إضافة مستند","Añadir Documento")}</button>
    </div>

    {showForm&&<form className="supplier-compliance-form" onSubmit={submit}>
      <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{TYPES.map(v=><option key={v} value={v}>{typeLabel(v,language)}</option>)}</select>
      <input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder={label(language,"Document title","Belge adı","اسم المستند","Título del documento")}/>
      <input value={form.document_number} onChange={e=>setForm({...form,document_number:e.target.value})} placeholder={label(language,"Document number","Belge numarası","رقم المستند","Número de documento")}/>
      <label><span>{label(language,"Issue date","Düzenlenme","تاريخ الإصدار","Fecha de emisión")}</span><input type="date" value={form.issued_at} onChange={e=>setForm({...form,issued_at:e.target.value})}/></label>
      <label><span>{label(language,"Expiry date","Son kullanma","تاريخ الانتهاء","Fecha de caducidad")}</span><input type="date" value={form.expires_at} onChange={e=>setForm({...form,expires_at:e.target.value})}/></label>
      <input type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" onChange={e=>setForm({...form,file:e.target.files?.[0]||null})}/>
      <textarea value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder={label(language,"Note","Not","ملاحظة","Nota")}/>
      <button type="submit" className="primary">{label(language,"Upload","Yükle","رفع","Subir")}</button>
    </form>}

    {loading?<div className="supplier-detail-state compact">{label(language,"Loading documents...","Belgeler yükleniyor...","جارٍ تحميل المستندات...","Cargando documentos...")}</div>:data.data?.length?<div className="supplier-detail-table-wrap"><table><thead><tr><th>{label(language,"Document","Belge","المستند","Documento")}</th><th>{label(language,"Type","Tür","النوع","Tipo")}</th><th>{label(language,"Number","Numara","الرقم","Número")}</th><th>{label(language,"Issue Date","Düzenlenme","الإصدار","Emisión")}</th><th>{label(language,"Expiry","Son Kullanma","الانتهاء","Caducidad")}</th><th>{label(language,"Status","Durum","الحالة","Estado")}</th><th>{label(language,"Actions","İşlemler","الإجراءات","Acciones")}</th></tr></thead><tbody>{data.data.map(d=><tr key={d.id}><td><strong>{d.title}</strong><br/><small>{d.uploaded_by||"—"}</small></td><td>{typeLabel(d.type,language)}</td><td>{d.document_number||"—"}</td><td>{d.issued_at||"—"}</td><td>{d.expires_at||"—"}</td><td><span className={`supplier-compliance-status status-${d.status}`}>{statusLabel(d.status,language)}</span></td><td><a href={d.file_url} target="_blank" rel="noreferrer">{label(language,"Open","Aç","فتح","Abrir")}</a><button type="button" onClick={()=>remove(d.id)}>{label(language,"Delete","Sil","حذف","Eliminar")}</button></td></tr>)}</tbody></table></div>:<div className="supplier-detail-state">{label(language,"No compliance documents yet.","Henüz uygunluk belgesi yok.","لا توجد مستندات امتثال بعد.","Aún no hay documentos de cumplimiento.")}</div>}

    <div className="supplier-operation-pagination"><div>{meta.total||0} {label(language,"records","kayıt","سجل","registros")}</div><div><button disabled={(meta.current_page||1)<=1} onClick={()=>{const p=(meta.current_page||1)-1;setPage(p);load(p);}}>‹</button><span>{meta.current_page||1} / {meta.last_page||1}</span><button disabled={(meta.current_page||1)>=(meta.last_page||1)} onClick={()=>{const p=(meta.current_page||1)+1;setPage(p);load(p);}}>›</button></div><label><select value={perPage} onChange={e=>setPerPage(Number(e.target.value))}>{PAGE_SIZES.map(v=><option key={v}>{v}</option>)}</select><span>{label(language,"per page","sayfa başına","لكل صفحة","por página")}</span></label></div>
  </div>;
}

function K({label,value}){return <article className="supplier-detail-mini-kpi"><span>{label}</span><strong>{value}</strong></article>}
function label(lang,en,tr,ar,es){return lang==="tr"?tr:lang==="ar"?ar:lang==="es"?es:en}
function typeLabel(v,l){const m={contract:["Contract","Sözleşme","عقد","Contrato"],company_registration:["Company Registration","Şirket/Ticaret Belgesi","تسجيل الشركة","Registro Mercantil"],tax_document:["Tax Document","Vergi Belgesi","مستند ضريبي","Documento Fiscal"],insurance:["Insurance","Sigorta","تأمين","Seguro"],transport_license:["Transport License","Taşıma Lisansı","رخصة نقل","Licencia de Transporte"],tourism_license:["Tourism License","Turizm Lisansı","رخصة سياحية","Licencia de Turismo"],other:["Other","Diğer","أخرى","Otro"]};return label(l,...m[v])}
function statusLabel(v,l){const m={valid:["Valid","Geçerli","ساري","Válido"],expiring:["Expiring Soon","Yakında Doluyor","ينتهي قريبًا","Próximo a vencer"],expired:["Expired","Süresi Doldu","منتهي","Caducado"],no_expiry:["No Expiry","Süresiz","بدون انتهاء","Sin caducidad"]};return label(l,...(m[v]||[v,v,v,v]))}

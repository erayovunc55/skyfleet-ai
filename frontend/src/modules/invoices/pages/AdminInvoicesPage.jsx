import { useCallback, useEffect, useMemo, useState } from "react";
import invoiceService from "../services/invoiceService";
import "./admin-invoices-page.css";

const EMPTY_FILTERS = { search: "", status: "", currency: "", dateFrom: "", dateTo: "" };

const COPY = {
  tr: {
    loadError:"Faturalar yüklenemedi.", reasonError:"Düzeltme veya ret açıklaması en az 10 karakter olmalıdır.",
    updated:"Fatura durumu güncellendi.", updateError:"Fatura durumu güncellenemedi.",
    eyebrow:"BELGE VE MUTABAKAT", title:"Fatura Merkezi", subtitle:"Tedarikçi faturalarını hakediş kayıtlarıyla birlikte inceleyin.",
    loading:"Yükleniyor...", refresh:"Verileri Yenile", totalInvoices:"Toplam Fatura", underReview:"İncelemede",
    approved:"Onaylandı", revision:"Düzeltme", invoiceAmount:"Fatura Tutarı", currentData:"Güncel belge verisi",
    search:"Fatura ara", searchPlaceholder:"Fatura no, tedarikçi veya SF no...", status:"Durum", allStatuses:"Tüm durumlar",
    revisionRequested:"Düzeltme istendi", rejected:"Reddedildi", start:"Başlangıç", end:"Bitiş", filter:"Filtrele", clear:"Temizle",
    supplierInvoices:"Tedarikçi Faturaları", records:n=>`${n} kayıt görüntüleniyor`, invoicesLoading:"Faturalar yükleniyor...",
    noInvoices:"Filtrelere uygun fatura bulunamadı.", invoice:"Fatura", supplier:"Tedarikçi", date:"Tarih", entitlement:"Hakediş",
    amount:"Tutar", recordsShort:n=>`${n} kayıt`, previous:"← Önceki", page:(a,b)=>`Sayfa ${a} / ${b}`, next:"Sonraki →",
    detail:"FATURA DETAYI", invoiceDate:"Fatura tarihi", due:"Vade", file:"Dosya", entitlementCount:"Hakediş sayısı",
    download:"Faturayı İndir", linked:"Bağlı Hakedişler", reviewExplanation:"İnceleme açıklaması",
    reviewPlaceholder:"Düzeltme veya ret nedenini yazın...", approveInvoice:"Faturayı Onayla", requestRevision:"Düzeltme İste",
    rejectInvoice:"Faturayı Reddet",
    statusMap:{submitted:"İncelemede",approved:"Onaylandı",revision_requested:"Düzeltme İstendi",rejected:"Reddedildi"},
  },
  en: {
    loadError:"Invoices could not be loaded.", reasonError:"The revision or rejection reason must be at least 10 characters.",
    updated:"Invoice status updated.", updateError:"Invoice status could not be updated.",
    eyebrow:"DOCUMENTS & RECONCILIATION", title:"Invoice Center", subtitle:"Review supplier invoices together with payable records.",
    loading:"Loading...", refresh:"Refresh Data", totalInvoices:"Total Invoices", underReview:"Under Review",
    approved:"Approved", revision:"Revision", invoiceAmount:"Invoice Amount", currentData:"Current document data",
    search:"Search invoices", searchPlaceholder:"Invoice no., supplier or SF no...", status:"Status", allStatuses:"All statuses",
    revisionRequested:"Revision requested", rejected:"Rejected", start:"Start", end:"End", filter:"Filter", clear:"Clear",
    supplierInvoices:"Supplier Invoices", records:n=>`${n} records displayed`, invoicesLoading:"Loading invoices...",
    noInvoices:"No invoices match the filters.", invoice:"Invoice", supplier:"Supplier", date:"Date", entitlement:"Payables",
    amount:"Amount", recordsShort:n=>`${n} records`, previous:"← Previous", page:(a,b)=>`Page ${a} / ${b}`, next:"Next →",
    detail:"INVOICE DETAILS", invoiceDate:"Invoice date", due:"Due date", file:"File", entitlementCount:"Payable count",
    download:"Download Invoice", linked:"Linked Payables", reviewExplanation:"Review notes",
    reviewPlaceholder:"Enter the reason for revision or rejection...", approveInvoice:"Approve Invoice", requestRevision:"Request Revision",
    rejectInvoice:"Reject Invoice",
    statusMap:{submitted:"Under Review",approved:"Approved",revision_requested:"Revision Requested",rejected:"Rejected"},
  },
  es: {
    loadError:"No se pudieron cargar las facturas.", reasonError:"El motivo de corrección o rechazo debe tener al menos 10 caracteres.",
    updated:"Estado de la factura actualizado.", updateError:"No se pudo actualizar el estado de la factura.",
    eyebrow:"DOCUMENTOS Y CONCILIACIÓN", title:"Centro de Facturas", subtitle:"Revise las facturas de proveedores junto con los registros de pagos.",
    loading:"Cargando...", refresh:"Actualizar Datos", totalInvoices:"Total de Facturas", underReview:"En Revisión",
    approved:"Aprobadas", revision:"Corrección", invoiceAmount:"Importe de Facturas", currentData:"Datos actuales del documento",
    search:"Buscar factura", searchPlaceholder:"N.º de factura, proveedor o SF...", status:"Estado", allStatuses:"Todos los estados",
    revisionRequested:"Corrección solicitada", rejected:"Rechazada", start:"Inicio", end:"Fin", filter:"Filtrar", clear:"Limpiar",
    supplierInvoices:"Facturas de Proveedores", records:n=>`${n} registros mostrados`, invoicesLoading:"Cargando facturas...",
    noInvoices:"No se encontraron facturas para los filtros.", invoice:"Factura", supplier:"Proveedor", date:"Fecha", entitlement:"Pagos",
    amount:"Importe", recordsShort:n=>`${n} registros`, previous:"← Anterior", page:(a,b)=>`Página ${a} / ${b}`, next:"Siguiente →",
    detail:"DETALLES DE LA FACTURA", invoiceDate:"Fecha de factura", due:"Vencimiento", file:"Archivo", entitlementCount:"Número de pagos",
    download:"Descargar Factura", linked:"Pagos Vinculados", reviewExplanation:"Notas de revisión",
    reviewPlaceholder:"Escriba el motivo de la corrección o rechazo...", approveInvoice:"Aprobar Factura", requestRevision:"Solicitar Corrección",
    rejectInvoice:"Rechazar Factura",
    statusMap:{submitted:"En Revisión",approved:"Aprobada",revision_requested:"Corrección Solicitada",rejected:"Rechazada"},
  },
  ar: {
    loadError:"تعذر تحميل الفواتير.", reasonError:"يجب ألا يقل سبب التعديل أو الرفض عن 10 أحرف.",
    updated:"تم تحديث حالة الفاتورة.", updateError:"تعذر تحديث حالة الفاتورة.",
    eyebrow:"المستندات والتسوية", title:"مركز الفواتير", subtitle:"راجع فواتير الموردين مع سجلات المستحقات.",
    loading:"جارٍ التحميل...", refresh:"تحديث البيانات", totalInvoices:"إجمالي الفواتير", underReview:"قيد المراجعة",
    approved:"معتمدة", revision:"تعديل", invoiceAmount:"قيمة الفواتير", currentData:"بيانات المستند الحالية",
    search:"بحث عن فاتورة", searchPlaceholder:"رقم الفاتورة أو المورد أو رقم SF...", status:"الحالة", allStatuses:"جميع الحالات",
    revisionRequested:"طُلب تعديل", rejected:"مرفوضة", start:"البداية", end:"النهاية", filter:"تصفية", clear:"مسح",
    supplierInvoices:"فواتير الموردين", records:n=>`يتم عرض ${n} سجلات`, invoicesLoading:"جارٍ تحميل الفواتير...",
    noInvoices:"لا توجد فواتير مطابقة لعوامل التصفية.", invoice:"الفاتورة", supplier:"المورد", date:"التاريخ", entitlement:"المستحقات",
    amount:"المبلغ", recordsShort:n=>`${n} سجلات`, previous:"السابق ←", page:(a,b)=>`الصفحة ${a} / ${b}`, next:"→ التالي",
    detail:"تفاصيل الفاتورة", invoiceDate:"تاريخ الفاتورة", due:"تاريخ الاستحقاق", file:"الملف", entitlementCount:"عدد المستحقات",
    download:"تنزيل الفاتورة", linked:"المستحقات المرتبطة", reviewExplanation:"ملاحظات المراجعة",
    reviewPlaceholder:"اكتب سبب طلب التعديل أو الرفض...", approveInvoice:"اعتماد الفاتورة", requestRevision:"طلب تعديل",
    rejectInvoice:"رفض الفاتورة",
    statusMap:{submitted:"قيد المراجعة",approved:"معتمدة",revision_requested:"طُلب تعديل",rejected:"مرفوضة"},
  },
};

function normalizeLanguage(v){const x=String(v||"tr").toLowerCase();if(x.startsWith("en"))return"en";if(x.startsWith("es"))return"es";if(x.startsWith("ar"))return"ar";return"tr";}
function storedLanguage(){try{return normalizeLanguage(localStorage.getItem("skyfleet_language"));}catch{return"tr";}}
function localeFor(l){return({tr:"tr-TR",en:"en-GB",es:"es-ES",ar:"ar-SA"}[l]||"tr-TR");}

export default function AdminInvoicesPage() {
  const [language,setLanguage]=useState(storedLanguage);
  const [invoices,setInvoices]=useState([]);
  const [summary,setSummary]=useState({total:0,submitted:0,approved:0,revision_requested:0,rejected:0,currencies:[]});
  const [meta,setMeta]=useState({current_page:1,last_page:1,total:0});
  const [filters,setFilters]=useState(EMPTY_FILTERS);
  const [appliedFilters,setAppliedFilters]=useState(EMPTY_FILTERS);
  const [page,setPage]=useState(1);
  const [selectedInvoice,setSelectedInvoice]=useState(null);
  const [reviewReason,setReviewReason]=useState("");
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const t=COPY[language]||COPY.tr;

  useEffect(()=>{const sync=()=>setLanguage(storedLanguage());window.addEventListener("storage",sync);window.addEventListener("skyfleet-language-change",sync);const timer=window.setInterval(sync,300);return()=>{window.removeEventListener("storage",sync);window.removeEventListener("skyfleet-language-change",sync);window.clearInterval(timer);};},[]);

  const loadInvoices=useCallback(async()=>{
    setLoading(true);setError("");
    try{
      const response=await invoiceService.getInvoices({...appliedFilters,page,perPage:25});
      const items=Array.isArray(response?.data)?response.data:[];
      setInvoices(items);setSummary(response?.summary||{});setMeta(response?.meta||{current_page:1,last_page:1,total:0});
      setSelectedInvoice(current=>!current?(items[0]||null):(items.find(item=>Number(item.id)===Number(current.id))||items[0]||null));
    }catch(e){setError(getErrorMessage(e,COPY[storedLanguage()]?.loadError||COPY.tr.loadError));setInvoices([]);}
    finally{setLoading(false);}
  },[appliedFilters,page]);

  useEffect(()=>{loadInvoices();},[loadInvoices]);
  const currencyTotal=useMemo(()=>summary?.currencies?.[0]||{currency:"EUR",invoice_amount:"0.00"},[summary]);

  function applyFilters(event){event.preventDefault();setPage(1);setAppliedFilters({...filters});}
  function clearFilters(){setFilters(EMPTY_FILTERS);setAppliedFilters(EMPTY_FILTERS);setPage(1);}

  async function runAction(action){
    if(!selectedInvoice?.id)return;
    if(["revision","reject"].includes(action)&&reviewReason.trim().length<10){setError(t.reasonError);return;}
    setSaving(true);setError("");setMessage("");
    try{
      let response;
      if(action==="approve")response=await invoiceService.approve(selectedInvoice.id);
      if(action==="revision")response=await invoiceService.requestRevision(selectedInvoice.id,reviewReason.trim());
      if(action==="reject")response=await invoiceService.reject(selectedInvoice.id,reviewReason.trim());
      setMessage(response?.message||t.updated);setReviewReason("");await loadInvoices();
    }catch(e){setError(getErrorMessage(e,t.updateError));}
    finally{setSaving(false);}
  }

  return <main className="admin-invoices-page" dir={language==="ar"?"rtl":"ltr"}>
    <header className="admin-invoices-hero">
      <div><span>{t.eyebrow}</span><h1>{t.title}</h1><p>{t.subtitle}</p></div>
      <button type="button" onClick={loadInvoices} disabled={loading}>{loading?t.loading:t.refresh}</button>
    </header>

    <section className="admin-invoice-stats">
      <Stat label={t.totalInvoices} value={summary.total||0} tone="total" note={t.currentData}/>
      <Stat label={t.underReview} value={summary.submitted||0} tone="submitted" note={t.currentData}/>
      <Stat label={t.approved} value={summary.approved||0} tone="approved" note={t.currentData}/>
      <Stat label={t.revision} value={summary.revision_requested||0} tone="revision" note={t.currentData}/>
      <Stat label={t.invoiceAmount} value={formatMoney(currencyTotal.invoice_amount,currencyTotal.currency,language)} tone="money" note={t.currentData}/>
    </section>

    <form className="admin-invoice-filters" onSubmit={applyFilters}>
      <label><span>{t.search}</span><input placeholder={t.searchPlaceholder} value={filters.search} onChange={e=>setFilters(c=>({...c,search:e.target.value}))}/></label>
      <label><span>{t.status}</span><select value={filters.status} onChange={e=>setFilters(c=>({...c,status:e.target.value}))}><option value="">{t.allStatuses}</option><option value="submitted">{t.underReview}</option><option value="approved">{t.approved}</option><option value="revision_requested">{t.revisionRequested}</option><option value="rejected">{t.rejected}</option></select></label>
      <label><span>{t.start}</span><input type="date" value={filters.dateFrom} onChange={e=>setFilters(c=>({...c,dateFrom:e.target.value}))}/></label>
      <label><span>{t.end}</span><input type="date" value={filters.dateTo} onChange={e=>setFilters(c=>({...c,dateTo:e.target.value}))}/></label>
      <button type="submit">{t.filter}</button><button className="secondary" type="button" onClick={clearFilters}>{t.clear}</button>
    </form>

    {error&&<div className="admin-invoice-message error">{error}</div>}
    {message&&<div className="admin-invoice-message success">{message}</div>}

    <section className="admin-invoice-workspace">
      <div className="admin-invoice-list-card">
        <div className="card-heading"><div><h2>{t.supplierInvoices}</h2><p>{t.records(meta.total||0)}</p></div></div>
        {loading?<div className="invoice-state">{t.invoicesLoading}</div>:invoices.length===0?<div className="invoice-state">{t.noInvoices}</div>:(
          <div className="admin-invoice-table-wrap"><table><thead><tr><th>{t.invoice}</th><th>{t.supplier}</th><th>{t.date}</th><th>{t.entitlement}</th><th>{t.amount}</th><th>{t.status}</th></tr></thead>
          <tbody>{invoices.map(invoice=><tr key={invoice.id} className={Number(selectedInvoice?.id)===Number(invoice.id)?"active":""} onClick={()=>{setSelectedInvoice(invoice);setReviewReason("");}}>
            <td><strong>{invoice.invoice_number}</strong><small>{invoice.original_name}</small></td><td>{invoice.supplier?.company_name||"—"}</td>
            <td>{formatDate(invoice.invoice_date,language)}</td><td>{t.recordsShort(invoice.financial_count||0)}</td><td className="money">{formatMoney(invoice.amount,invoice.currency,language)}</td><td><Status status={invoice.status} t={t}/></td>
          </tr>)}</tbody></table></div>
        )}
        {meta.last_page>1&&<div className="invoice-pagination"><button disabled={page<=1||loading} onClick={()=>setPage(v=>v-1)}>{t.previous}</button><span>{t.page(meta.current_page,meta.last_page)}</span><button disabled={page>=meta.last_page||loading} onClick={()=>setPage(v=>v+1)}>{t.next}</button></div>}
      </div>

      {selectedInvoice&&<aside className="admin-invoice-detail">
        <div className="detail-heading"><div><span>{t.detail}</span><h2>{selectedInvoice.invoice_number}</h2></div><button type="button" onClick={()=>setSelectedInvoice(null)}>×</button></div>
        <Status status={selectedInvoice.status} t={t}/>
        <div className="detail-amount"><span>{t.invoiceAmount}</span><strong>{formatMoney(selectedInvoice.amount,selectedInvoice.currency,language)}</strong></div>
        <div className="detail-rows">
          <Row label={t.supplier} value={selectedInvoice.supplier?.company_name}/><Row label={t.invoiceDate} value={formatDate(selectedInvoice.invoice_date,language)}/>
          <Row label={t.due} value={formatDate(selectedInvoice.due_date,language)}/><Row label={t.file} value={selectedInvoice.original_name}/><Row label={t.entitlementCount} value={selectedInvoice.financial_count}/>
        </div>
        <button className="download-invoice" type="button" onClick={()=>invoiceService.download(selectedInvoice.id,selectedInvoice.original_name)}>{t.download}</button>
        <div className="linked-financials"><h3>{t.linked}</h3>{selectedInvoice.financials?.map(financial=><div key={financial.id}><span><strong>{financial.booking_reference}</strong><small>{financial.passenger_name}</small></span><b>{formatMoney(financial.supplier_amount,financial.currency,language)}</b></div>)}</div>
        {selectedInvoice.rejection_reason&&<div className="existing-review"><strong>{t.reviewExplanation}</strong><p>{selectedInvoice.rejection_reason}</p></div>}
        {["submitted","revision_requested"].includes(selectedInvoice.status)&&<div className="invoice-review-actions">
          <label><span>{t.reviewExplanation}</span><textarea placeholder={t.reviewPlaceholder} value={reviewReason} onChange={e=>setReviewReason(e.target.value)}/></label>
          <button className="approve" disabled={saving} onClick={()=>runAction("approve")}>{t.approveInvoice}</button>
          <button className="revision" disabled={saving} onClick={()=>runAction("revision")}>{t.requestRevision}</button>
          <button className="reject" disabled={saving} onClick={()=>runAction("reject")}>{t.rejectInvoice}</button>
        </div>}
      </aside>}
    </section>
  </main>;
}

function Stat({label,value,tone,note}){return <article className={`admin-invoice-stat ${tone}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;}
function Row({label,value}){return <div><span>{label}</span><strong>{value||"—"}</strong></div>;}
function Status({status,t}){return <span className={`admin-invoice-status ${status}`}>{t.statusMap[status]||status}</span>;}
function formatMoney(value,currency="EUR",language="tr"){try{return new Intl.NumberFormat(localeFor(language),{style:"currency",currency:currency||"EUR"}).format(Number(value||0));}catch{return`${Number(value||0).toFixed(2)} ${currency}`;}}
function formatDate(value,language="tr"){if(!value)return"—";const date=new Date(value);return Number.isNaN(date.getTime())?"—":date.toLocaleDateString(localeFor(language));}
function getErrorMessage(error,fallback){const errors=error?.response?.data?.errors;return(errors?Object.values(errors).flat().find(Boolean):null)||error?.response?.data?.message||error?.message||fallback;}

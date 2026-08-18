import { useEffect, useMemo, useState } from "react";

import { useLanguage } from "../../../i18n";
import financeService from "../../finance/services/financeService";
import transferService from "../../transfers/services/transferService";
import supplierService from "../services/supplierService";

const PAGE_SIZE_OPTIONS = [20, 50, 100];
const ACTIVE_STATUSES = ["accepted", "on_the_way", "arrived", "passenger_called", "passenger_on_board", "trip_started"];
const TRANSFER_STATUSES = ["pending", "accepted", "on_the_way", "arrived", "passenger_called", "passenger_on_board", "trip_started", "completed", "no_show", "cancelled"];

const TEXT = {
  tr: {
    eyebrow:"TEDARİKÇİ DETAY MERKEZİ",close:"Kapat",loading:"Tedarikçi detayları yükleniyor...",loadError:"Tedarikçi detayları yüklenemedi.",overview:"Genel Bakış",drivers:"Sürücüler",vehicles:"Araçlar",operations:"Operasyonlar",finance:"Finans",documents:"Belgeler & Uygunluk",activity:"Aktivite Geçmişi",operational:"Operasyona Açık",closed:"Operasyona Kapalı",approved:"Onaylı",status:"Durum",location:"Konum",contact:"Yetkili",email:"E-posta",phone:"Telefon",whatsapp:"WhatsApp",website:"Web Sitesi",tax:"Vergi No",registration:"Kayıt No",currency:"Para Birimi",timezone:"Saat Dilimi",branches:"Şubeler",noData:"Bilgi bulunmuyor",noDrivers:"Bu tedarikçiye bağlı sürücü yok.",noVehicles:"Bu tedarikçiye bağlı araç yok.",noOperations:"Bu tedarikçiye atanmış transfer bulunmuyor.",noDocuments:"Bu tedarikçi için henüz belge kaydı bulunmuyor.",noActivity:"Henüz aktivite kaydı bulunmuyor.",driver:"Sürücü",vehicle:"Araç",plate:"Plaka",assignment:"Araç Ataması",active:"Aktif",passive:"Pasif",booking:"Rezervasyon",passenger:"Yolcu",pickup:"Alış",dropoff:"Bırakış",date:"Tarih",amount:"Tutar",operationStatus:"Operasyon Durumu",capacity:"Kapasite",insurance:"Sigorta",totalTransfers:"Toplam Transfer",activeTransfers:"Aktif Operasyon",completed:"Tamamlanan",recordedSales:"Kayıtlı Satış",operationalSnapshot:"Operasyon Özeti",contactProfile:"İletişim & Kurumsal Bilgiler",readiness:"Operasyon Hazırlığı",driverCoverage:"Sürücü Kapsamı",vehicleCoverage:"Araç Kapsamı",branchCoverage:"Şube Ağı",approvalState:"Onay Durumu",branchesTitle:"Şube & Lokasyon",complianceTitle:"Belge Durumu",activityTitle:"Onay & Aktivite Logu",action:"İşlem",changedBy:"İşlemi Yapan",note:"Not",notConnected:"Belge yönetimi veri kaynağı henüz bu tedarikçiye bağlanmamış.",operationSearch:"Rezervasyon, yolcu, adres veya uçuş ara...",allStatuses:"Tüm durumlar",startDate:"Başlangıç",endDate:"Bitiş",clearFilters:"Filtreleri Temizle",showing:"Gösterilen",of:"/",page:"Sayfa",previous:"Önceki",next:"Sonraki",perPage:"sayfa başına",pending:"Bekliyor",accepted:"Atandı",on_the_way:"Yolda",arrived:"Alış Noktasında",passenger_called:"Yolcu Arandı",passenger_on_board:"Yolcu Araçta",trip_started:"Transfer Başladı",completedStatus:"Tamamlandı",no_show:"No Show",cancelled:"İptal",
    financeTitle:"Gerçek Finans Özeti",gross:"Brüt Satış",supplierPayable:"Tedarikçi Hakedişi",platformMargin:"Platform Marjı",financialRecords:"Finans Kaydı",financeEmpty:"Bu tedarikçi için henüz finans kaydı yok.",financeSource:"Bu değerler transfer_financials kayıtlarından ve gerçek supplier_id filtresinden gelir.",approvedPayments:"Onaylanan",paidPayments:"Ödenen",disputedPayments:"İtirazlı"
  },
  en: {
    eyebrow:"SUPPLIER DETAIL CENTER",close:"Close",loading:"Loading supplier details...",loadError:"Supplier details could not be loaded.",overview:"Overview",drivers:"Drivers",vehicles:"Vehicles",operations:"Operations",finance:"Finance",documents:"Documents & Compliance",activity:"Activity Log",operational:"Operational",closed:"Closed",approved:"Approved",status:"Status",location:"Location",contact:"Contact",email:"Email",phone:"Phone",whatsapp:"WhatsApp",website:"Website",tax:"Tax No",registration:"Registration No",currency:"Currency",timezone:"Timezone",branches:"Branches",noData:"Not provided",noDrivers:"No drivers belong to this supplier.",noVehicles:"No vehicles belong to this supplier.",noOperations:"No transfers are assigned to this supplier.",noDocuments:"No document records are available for this supplier yet.",noActivity:"No activity records yet.",driver:"Driver",vehicle:"Vehicle",plate:"Plate",assignment:"Vehicle Assignment",active:"Active",passive:"Inactive",booking:"Booking",passenger:"Passenger",pickup:"Pickup",dropoff:"Dropoff",date:"Date",amount:"Amount",operationStatus:"Operation Status",capacity:"Capacity",insurance:"Insurance",totalTransfers:"Total Transfers",activeTransfers:"Active Operations",completed:"Completed",recordedSales:"Recorded Sales",operationalSnapshot:"Operational Snapshot",contactProfile:"Contact & Corporate Information",readiness:"Operational Readiness",driverCoverage:"Driver Coverage",vehicleCoverage:"Vehicle Coverage",branchCoverage:"Branch Network",approvalState:"Approval Status",branchesTitle:"Branches & Locations",complianceTitle:"Document Status",activityTitle:"Approval & Activity Log",action:"Action",changedBy:"Changed By",note:"Note",notConnected:"The document management data source has not yet been connected for this supplier.",operationSearch:"Search booking, passenger, address or flight...",allStatuses:"All statuses",startDate:"Start date",endDate:"End date",clearFilters:"Clear Filters",showing:"Showing",of:"of",page:"Page",previous:"Previous",next:"Next",perPage:"per page",pending:"Pending",accepted:"Assigned",on_the_way:"En Route",arrived:"At Pickup",passenger_called:"Passenger Called",passenger_on_board:"Passenger On Board",trip_started:"Trip Started",completedStatus:"Completed",no_show:"No Show",cancelled:"Cancelled",
    financeTitle:"Real Finance Summary",gross:"Gross Sales",supplierPayable:"Supplier Payable",platformMargin:"Platform Margin",financialRecords:"Financial Records",financeEmpty:"No financial records exist for this supplier yet.",financeSource:"These values come from transfer_financials records filtered by the real supplier_id.",approvedPayments:"Approved",paidPayments:"Paid",disputedPayments:"Disputed"
  },
  ar: {
    eyebrow:"مركز تفاصيل المورد",close:"إغلاق",loading:"جارٍ تحميل تفاصيل المورد...",loadError:"تعذر تحميل تفاصيل المورد.",overview:"نظرة عامة",drivers:"السائقون",vehicles:"المركبات",operations:"العمليات",finance:"المالية",documents:"المستندات والامتثال",activity:"سجل النشاط",operational:"تشغيلي",closed:"مغلق",approved:"معتمد",status:"الحالة",location:"الموقع",contact:"جهة الاتصال",email:"البريد",phone:"الهاتف",whatsapp:"واتساب",website:"الموقع الإلكتروني",tax:"الرقم الضريبي",registration:"رقم التسجيل",currency:"العملة",timezone:"المنطقة الزمنية",branches:"الفروع",noData:"غير محدد",noDrivers:"لا يوجد سائقون تابعون لهذا المورد.",noVehicles:"لا توجد مركبات تابعة لهذا المورد.",noOperations:"لا توجد رحلات معينة لهذا المورد.",noDocuments:"لا توجد مستندات مسجلة لهذا المورد بعد.",noActivity:"لا يوجد سجل نشاط بعد.",driver:"السائق",vehicle:"المركبة",plate:"اللوحة",assignment:"تعيين المركبة",active:"نشط",passive:"غير نشط",booking:"الحجز",passenger:"الراكب",pickup:"الاستلام",dropoff:"التوصيل",date:"التاريخ",amount:"المبلغ",operationStatus:"حالة العملية",capacity:"السعة",insurance:"التأمين",totalTransfers:"إجمالي الرحلات",activeTransfers:"العمليات النشطة",completed:"المكتملة",recordedSales:"المبيعات المسجلة",operationalSnapshot:"ملخص العمليات",contactProfile:"بيانات الاتصال والشركة",readiness:"الجاهزية التشغيلية",driverCoverage:"تغطية السائقين",vehicleCoverage:"تغطية المركبات",branchCoverage:"شبكة الفروع",approvalState:"حالة الاعتماد",branchesTitle:"الفروع والمواقع",complianceTitle:"حالة المستندات",activityTitle:"سجل الاعتماد والنشاط",action:"الإجراء",changedBy:"تم بواسطة",note:"ملاحظة",notConnected:"لم يتم ربط مصدر بيانات إدارة المستندات لهذا المورد بعد.",operationSearch:"ابحث بالحجز أو الراكب أو العنوان أو الرحلة...",allStatuses:"كل الحالات",startDate:"تاريخ البدء",endDate:"تاريخ الانتهاء",clearFilters:"مسح الفلاتر",showing:"عرض",of:"من",page:"صفحة",previous:"السابق",next:"التالي",perPage:"لكل صفحة",pending:"قيد الانتظار",accepted:"تم التعيين",on_the_way:"في الطريق",arrived:"في نقطة الاستلام",passenger_called:"تم الاتصال بالراكب",passenger_on_board:"الراكب في المركبة",trip_started:"بدأت الرحلة",completedStatus:"مكتمل",no_show:"عدم حضور",cancelled:"ملغي",
    financeTitle:"الملخص المالي الحقيقي",gross:"إجمالي المبيعات",supplierPayable:"مستحق المورد",platformMargin:"هامش المنصة",financialRecords:"السجلات المالية",financeEmpty:"لا توجد سجلات مالية لهذا المورد بعد.",financeSource:"تأتي هذه القيم من سجلات transfer_financials المفلترة حسب supplier_id الحقيقي.",approvedPayments:"معتمد",paidPayments:"مدفوع",disputedPayments:"متنازع عليه"
  },
  es: {
    eyebrow:"CENTRO DE DETALLE DEL PROVEEDOR",close:"Cerrar",loading:"Cargando detalles del proveedor...",loadError:"No se pudieron cargar los detalles del proveedor.",overview:"Resumen",drivers:"Conductores",vehicles:"Vehículos",operations:"Operaciones",finance:"Finanzas",documents:"Documentos y Cumplimiento",activity:"Registro de Actividad",operational:"Operativo",closed:"Cerrado",approved:"Aprobado",status:"Estado",location:"Ubicación",contact:"Contacto",email:"Correo",phone:"Teléfono",whatsapp:"WhatsApp",website:"Sitio web",tax:"N.º fiscal",registration:"N.º de registro",currency:"Moneda",timezone:"Zona horaria",branches:"Sucursales",noData:"No indicado",noDrivers:"No hay conductores asociados a este proveedor.",noVehicles:"No hay vehículos asociados a este proveedor.",noOperations:"No hay traslados asignados a este proveedor.",noDocuments:"Aún no hay documentos registrados para este proveedor.",noActivity:"Aún no hay registros de actividad.",driver:"Conductor",vehicle:"Vehículo",plate:"Matrícula",assignment:"Asignación de Vehículo",active:"Activo",passive:"Inactivo",booking:"Reserva",passenger:"Pasajero",pickup:"Recogida",dropoff:"Destino",date:"Fecha",amount:"Importe",operationStatus:"Estado Operativo",capacity:"Capacidad",insurance:"Seguro",totalTransfers:"Traslados Totales",activeTransfers:"Operaciones Activas",completed:"Completados",recordedSales:"Ventas Registradas",operationalSnapshot:"Resumen Operativo",contactProfile:"Contacto e Información Corporativa",readiness:"Preparación Operativa",driverCoverage:"Cobertura de Conductores",vehicleCoverage:"Cobertura de Vehículos",branchCoverage:"Red de Sucursales",approvalState:"Estado de Aprobación",branchesTitle:"Sucursales y Ubicaciones",complianceTitle:"Estado de Documentos",activityTitle:"Registro de Aprobación y Actividad",action:"Acción",changedBy:"Realizado por",note:"Nota",notConnected:"La fuente de datos de gestión documental aún no está conectada para este proveedor.",operationSearch:"Buscar reserva, pasajero, dirección o vuelo...",allStatuses:"Todos los estados",startDate:"Fecha inicial",endDate:"Fecha final",clearFilters:"Limpiar Filtros",showing:"Mostrando",of:"de",page:"Página",previous:"Anterior",next:"Siguiente",perPage:"por página",pending:"Pendiente",accepted:"Asignado",on_the_way:"En Ruta",arrived:"En Recogida",passenger_called:"Pasajero Contactado",passenger_on_board:"Pasajero a Bordo",trip_started:"Viaje Iniciado",completedStatus:"Completado",no_show:"No Show",cancelled:"Cancelado",
    financeTitle:"Resumen Financiero Real",gross:"Ventas Brutas",supplierPayable:"Pago al Proveedor",platformMargin:"Margen de Plataforma",financialRecords:"Registros Financieros",financeEmpty:"Aún no existen registros financieros para este proveedor.",financeSource:"Estos valores provienen de transfer_financials filtrados por el supplier_id real.",approvedPayments:"Aprobados",paidPayments:"Pagados",disputedPayments:"En Disputa"
  }
};

export default function SupplierDetailCenter({ supplierId, drivers = [], vehicles = [], onClose }) {
  const { language } = useLanguage();
  const text = TEXT[language] || TEXT.en;
  const [supplier, setSupplier] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [financialData, setFinancialData] = useState(null);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [detail, transferResponse, financialResponse] = await Promise.all([
          supplierService.getSupplier(supplierId),
          transferService.getDispatcherTransfers(),
          financeService.getFinancials({ supplier_id: supplierId, per_page: 20 }),
        ]);
        if (!mounted) return;
        setSupplier(detail);
        setFinancialData(financialResponse || null);
        const rows = Array.isArray(transferResponse?.data) ? transferResponse.data : Array.isArray(transferResponse) ? transferResponse : [];
        setTransfers(rows.filter((item) => Number(item.supplier_id || item.supplier?.id || item.supplier_company?.id) === Number(supplierId)));
      } catch (requestError) {
        if (mounted) setError(requestError?.response?.data?.message || requestError?.message || text.loadError);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [supplierId, text.loadError]);

  const supplierDrivers = useMemo(() => drivers.filter((item) => Number(item.supplier_id || item.supplier_company?.id) === Number(supplierId)), [drivers, supplierId]);
  const supplierVehicles = useMemo(() => vehicles.filter((item) => Number(item.supplier_id || item.supplier_company?.id) === Number(supplierId)), [vehicles, supplierId]);
  const transferSummary = useMemo(() => ({
    completed: transfers.filter((item) => item.status === "completed").length,
    active: transfers.filter((item) => ACTIVE_STATUSES.includes(item.status)).length,
    sales: transfers.reduce((sum, item) => sum + (Number(item.price) || 0), 0),
  }), [transfers]);

  const tabs = ["overview", "drivers", "vehicles", "operations", "finance", "documents", "activity"];

  return <div className="supplier-detail-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
    <section className="supplier-detail-center" role="dialog" aria-modal="true">
      <header className="supplier-detail-header">
        <div><small>{text.eyebrow}</small><h2>{supplier?.company_name || "Supplier"}</h2><p>{formatLocation(supplier) || text.noData}</p></div>
        <div className="supplier-detail-header-side">{supplier && <span className={`supplier-detail-operation ${supplier.is_active ? "is-open" : "is-closed"}`}>{supplier.is_active ? text.operational : text.closed}</span>}<button type="button" onClick={onClose}>× {text.close}</button></div>
      </header>
      <nav className="supplier-detail-tabs">{tabs.map((item) => <button key={item} type="button" className={tab === item ? "is-active" : ""} onClick={() => setTab(item)}>{text[item]}</button>)}</nav>
      <div className="supplier-detail-body">
        {loading && <div className="supplier-detail-state">{text.loading}</div>}
        {error && <div className="supplier-detail-state error">{error}</div>}
        {!loading && !error && supplier && <>
          {tab === "overview" && <Overview supplier={supplier} text={text} drivers={supplierDrivers.length} vehicles={supplierVehicles.length} transfers={transfers.length} finance={transferSummary} />}
          {tab === "drivers" && <Drivers rows={supplierDrivers} text={text} />}
          {tab === "vehicles" && <Vehicles rows={supplierVehicles} text={text} />}
          {tab === "operations" && <Operations rows={transfers} text={text} language={language} />}
          {tab === "finance" && <Finance data={financialData} text={text} />}
          {tab === "documents" && <Documents supplier={supplier} text={text} />}
          {tab === "activity" && <Activity supplier={supplier} text={text} language={language} />}
        </>}
      </div>
    </section>
  </div>;
}

function Overview({ supplier, text, drivers, vehicles, transfers, finance }) {
  const branchCount = supplier.branches?.length || supplier.branches_count || 0;
  const statusLabel = supplier.status === "approved" ? text.approved : supplier.status || text.noData;
  return <div className="supplier-detail-stack">
    <section className="supplier-detail-section"><h3>{text.operationalSnapshot}</h3><div className="supplier-detail-kpis"><MiniKpi label={text.totalTransfers} value={transfers}/><MiniKpi label={text.activeTransfers} value={finance.active}/><MiniKpi label={text.completed} value={finance.completed}/><MiniKpi label={text.recordedSales} value={`${finance.sales.toFixed(2)} ${supplier.default_currency || ""}`}/></div></section>
    <section className="supplier-detail-section"><h3>{text.readiness}</h3><div className="supplier-detail-kpis"><MiniKpi label={text.driverCoverage} value={drivers}/><MiniKpi label={text.vehicleCoverage} value={vehicles}/><MiniKpi label={text.branchCoverage} value={branchCount}/><MiniKpi label={text.approvalState} value={statusLabel}/></div></section>
    <section className="supplier-detail-section"><h3>{text.contactProfile}</h3><div className="supplier-detail-info-grid"><Info label={text.status} value={statusLabel}/><Info label={text.location} value={formatLocation(supplier)}/><Info label={text.contact} value={supplier.contact_name}/><Info label={text.email} value={supplier.email}/><Info label={text.phone} value={supplier.phone}/><Info label={text.whatsapp} value={supplier.whatsapp}/><Info label={text.website} value={supplier.website}/><Info label={text.tax} value={supplier.tax_number}/><Info label={text.registration} value={supplier.registration_number}/><Info label={text.currency} value={supplier.default_currency}/><Info label={text.timezone} value={supplier.timezone}/><Info label={text.branches} value={branchCount}/></div></section>
  </div>;
}

function Drivers({ rows, text }) {
  if (!rows.length) return <div className="supplier-detail-state">{text.noDrivers}</div>;
  return <div className="supplier-detail-table-wrap"><table><thead><tr><th>{text.driver}</th><th>{text.phone}</th><th>{text.email}</th><th>{text.assignment}</th><th>{text.status}</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.phone || "—"}</td><td>{item.email || "—"}</td><td>{item.vehicle?.plate || item.vehicle_plate || "—"}</td><td>{item.is_active ? text.active : text.passive}</td></tr>)}</tbody></table></div>;
}

function Vehicles({ rows, text }) {
  if (!rows.length) return <div className="supplier-detail-state">{text.noVehicles}</div>;
  return <div className="supplier-detail-table-wrap"><table><thead><tr><th>{text.plate}</th><th>{text.vehicle}</th><th>{text.status}</th><th>{text.capacity}</th><th>{text.insurance}</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td><strong>{item.plate}</strong></td><td>{[item.brand,item.model].filter(Boolean).join(" ") || "—"}</td><td>{item.is_active ? text.active : text.passive}</td><td>{item.passenger_capacity ?? "—"}</td><td>{item.insurance_expiry_date || "—"}</td></tr>)}</tbody></table></div>;
}

function Operations({ rows, text, language }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    return rows.filter((item) => {
      if (status && item.status !== status) return false;
      const pickupTime = item.pickup_time ? new Date(item.pickup_time) : null;
      if (startDate && pickupTime && pickupTime < new Date(`${startDate}T00:00:00`)) return false;
      if (endDate && pickupTime && pickupTime > new Date(`${endDate}T23:59:59`)) return false;
      if (!q) return true;
      const haystack = [item.booking_reference,item.ota_booking_reference,item.passenger_name,item.passenger_phone,item.flight_number,item.pickup,item.dropoff,item.pickup_location?.name,item.dropoff_location?.name].filter(Boolean).join(" ").toLocaleLowerCase();
      return haystack.includes(q);
    });
  }, [rows, search, status, startDate, endDate]);

  useEffect(() => { setPage(1); }, [search, status, startDate, endDate, pageSize]);
  const lastPage = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, lastPage);
  const from = filtered.length ? (safePage - 1) * pageSize + 1 : 0;
  const to = Math.min(safePage * pageSize, filtered.length);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  if (!rows.length) return <div className="supplier-detail-state">{text.noOperations}</div>;

  return <div className="supplier-operation-workspace">
    <div className="supplier-operation-filters">
      <input type="search" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder={text.operationSearch}/>
      <select value={status} onChange={(e)=>setStatus(e.target.value)}><option value="">{text.allStatuses}</option>{TRANSFER_STATUSES.map((value)=><option key={value} value={value}>{getTransferStatusLabel(value,text)}</option>)}</select>
      <label><span>{text.startDate}</span><input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)}/></label>
      <label><span>{text.endDate}</span><input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)}/></label>
      <button type="button" onClick={()=>{setSearch("");setStatus("");setStartDate("");setEndDate("");}}>{text.clearFilters}</button>
    </div>

    {pageRows.length ? <div className="supplier-detail-table-wrap"><table><thead><tr><th>{text.booking}</th><th>{text.passenger}</th><th>{text.date}</th><th>{text.pickup}</th><th>{text.dropoff}</th><th>{text.amount}</th><th>{text.operationStatus}</th></tr></thead><tbody>{pageRows.map((item)=><tr key={item.id}><td><strong>{item.booking_reference || item.ota_booking_reference || `#${item.id}`}</strong></td><td>{item.passenger_name || "—"}</td><td>{formatDate(item.pickup_time,language,true)}</td><td>{item.pickup || item.pickup_location?.name || "—"}</td><td>{item.dropoff || item.dropoff_location?.name || "—"}</td><td>{item.price != null ? `${item.price} ${item.currency || ""}` : "—"}</td><td><span className={`supplier-transfer-status status-${item.status || "pending"}`}>{getTransferStatusLabel(item.status,text)}</span></td></tr>)}</tbody></table></div> : <div className="supplier-detail-state">{text.noOperations}</div>}

    <div className="supplier-operation-pagination">
      <div>{text.showing} <strong>{from}-{to}</strong> {text.of} <strong>{filtered.length}</strong></div>
      <div><button type="button" disabled={safePage<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>‹ {text.previous}</button><span>{text.page} <strong>{safePage}</strong> / {lastPage}</span><button type="button" disabled={safePage>=lastPage} onClick={()=>setPage(p=>Math.min(lastPage,p+1))}>{text.next} ›</button></div>
      <label><select value={pageSize} onChange={(e)=>setPageSize(Number(e.target.value))}>{PAGE_SIZE_OPTIONS.map(size=><option key={size} value={size}>{size}</option>)}</select><span>{text.perPage}</span></label>
    </div>
  </div>;
}

function Finance({ data, text }) {
  const summary = Array.isArray(data?.summary) ? data.summary : [];
  const counts = data?.status_counts || {};
  const totalRecords = Number(data?.meta?.total || 0);
  if (!summary.length && totalRecords === 0) return <div className="supplier-detail-state">{text.financeEmpty}</div>;

  return <div className="supplier-detail-stack">
    <section className="supplier-detail-section">
      <h3>{text.financeTitle}</h3>
      {summary.map((item) => <div className="supplier-detail-kpis" key={item.currency}>
        <MiniKpi label={text.gross} value={`${Number(item.gross_amount || 0).toFixed(2)} ${item.currency || ""}`} />
        <MiniKpi label={text.supplierPayable} value={`${Number(item.supplier_payable || 0).toFixed(2)} ${item.currency || ""}`} />
        <MiniKpi label={text.platformMargin} value={`${Number(item.platform_margin || 0).toFixed(2)} ${item.currency || ""}`} />
        <MiniKpi label={text.financialRecords} value={Number(item.transfer_count || 0)} />
      </div>)}
    </section>
    <section className="supplier-detail-section">
      <h3>{text.status}</h3>
      <div className="supplier-detail-kpis">
        <MiniKpi label={text.pending} value={Number(counts.pending || 0)} />
        <MiniKpi label={text.approvedPayments} value={Number(counts.approved || 0)} />
        <MiniKpi label={text.paidPayments} value={Number(counts.paid || 0)} />
        <MiniKpi label={text.disputedPayments} value={Number(counts.disputed || 0)} />
      </div>
    </section>
    <div className="supplier-detail-note">{text.financeSource}</div>
  </div>;
}

function Documents({ supplier, text }) {
  const branches=Array.isArray(supplier.branches)?supplier.branches:[];
  return <div className="supplier-detail-stack"><section className="supplier-detail-section"><h3>{text.branchesTitle}</h3>{branches.length?<div className="supplier-branch-grid">{branches.map(item=><article key={item.id}><strong>{item.name||item.city||"Branch"}</strong><span>{[item.city,item.country_name||item.country_code].filter(Boolean).join(", ")||item.address||"—"}</span></article>)}</div>:<div className="supplier-detail-state">{text.noData}</div>}</section><section className="supplier-detail-section"><h3>{text.complianceTitle}</h3><div className="supplier-detail-note">{text.notConnected}</div></section></div>;
}

function Activity({ supplier, text, language }) {
  const rows=Array.isArray(supplier.approval_logs)?supplier.approval_logs:[];
  if(!rows.length)return <div className="supplier-detail-state">{text.noActivity}</div>;
  return <div className="supplier-detail-table-wrap"><table><thead><tr><th>{text.date}</th><th>{text.action}</th><th>{text.status}</th><th>{text.changedBy}</th><th>{text.note}</th></tr></thead><tbody>{rows.map(item=><tr key={item.id}><td>{formatDate(item.created_at,language,true)}</td><td>{item.action||"—"}</td><td>{item.old_status&&item.new_status?`${item.old_status} → ${item.new_status}`:item.new_status||"—"}</td><td>{item.changed_by?.name||item.changedBy?.name||"—"}</td><td>{item.note||item.reason||"—"}</td></tr>)}</tbody></table></div>;
}

function MiniKpi({ label, value }) { return <article className="supplier-detail-mini-kpi"><span>{label}</span><strong>{value}</strong></article>; }
function Info({ label, value }) { return <div className="supplier-detail-info"><span>{label}</span><strong>{value || "—"}</strong></div>; }
function getTransferStatusLabel(status,text){ if(status==="completed") return text.completedStatus; return text[status] || status || "—"; }
function formatLocation(item){return item?[item.city,item.country_name||item.country_code].filter(Boolean).join(", "):"";}
function formatDate(value,language,withTime=false){if(!value)return "—";const date=new Date(value);if(Number.isNaN(date.getTime()))return value;const locale=language==="tr"?"tr-TR":language==="ar"?"ar-SA":language==="es"?"es-ES":"en-GB";return date.toLocaleString(locale,withTime?{dateStyle:"short",timeStyle:"short"}:{dateStyle:"short"});}

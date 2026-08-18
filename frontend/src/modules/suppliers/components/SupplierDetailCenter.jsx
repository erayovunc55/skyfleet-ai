import { useEffect, useMemo, useState } from "react";

import { useLanguage } from "../../../i18n";
import transferService from "../../transfers/services/transferService";
import supplierService from "../services/supplierService";

const TEXT = {
  tr: {
    eyebrow: "TEDARİKÇİ DETAY MERKEZİ", close: "Kapat", loading: "Tedarikçi detayları yükleniyor...", loadError: "Tedarikçi detayları yüklenemedi.",
    overview: "Genel Bakış", drivers: "Sürücüler", vehicles: "Araçlar", operations: "Operasyonlar", finance: "Finans", documents: "Belgeler & Uygunluk", activity: "Aktivite Geçmişi",
    operational: "Operasyona Açık", closed: "Operasyona Kapalı", approved: "Onaylı", status: "Durum", location: "Konum", contact: "Yetkili", email: "E-posta", phone: "Telefon", whatsapp: "WhatsApp", website: "Web Sitesi", tax: "Vergi No", registration: "Kayıt No", currency: "Para Birimi", timezone: "Saat Dilimi", branches: "Şubeler",
    noData: "Bilgi bulunmuyor", noDrivers: "Bu tedarikçiye bağlı sürücü yok.", noVehicles: "Bu tedarikçiye bağlı araç yok.", noOperations: "Bu tedarikçiye atanmış transfer bulunmuyor.", noDocuments: "Bu tedarikçi için henüz belge kaydı bulunmuyor.", noActivity: "Henüz aktivite kaydı bulunmuyor.",
    driver: "Sürücü", vehicle: "Araç", plate: "Plaka", assignment: "Araç Ataması", active: "Aktif", passive: "Pasif", booking: "Rezervasyon", passenger: "Yolcu", pickup: "Alış", dropoff: "Bırakış", date: "Tarih", amount: "Tutar", operationStatus: "Operasyon Durumu",
    totalTransfers: "Toplam Transfer", activeTransfers: "Aktif Operasyon", completed: "Tamamlanan", recordedSales: "Kayıtlı Satış", financeNote: "Bu özet yalnız sistemdeki gerçek rezervasyon fiyatlarından hesaplanır.",
    branchesTitle: "Şube & Lokasyon", complianceTitle: "Belge Durumu", activityTitle: "Onay & Aktivite Logu", action: "İşlem", changedBy: "İşlemi Yapan", note: "Not", notConnected: "Belge yönetimi veri kaynağı henüz bu tedarikçiye bağlanmamış.",
  },
  en: {
    eyebrow: "SUPPLIER DETAIL CENTER", close: "Close", loading: "Loading supplier details...", loadError: "Supplier details could not be loaded.",
    overview: "Overview", drivers: "Drivers", vehicles: "Vehicles", operations: "Operations", finance: "Finance", documents: "Documents & Compliance", activity: "Activity Log",
    operational: "Operational", closed: "Closed", approved: "Approved", status: "Status", location: "Location", contact: "Contact", email: "Email", phone: "Phone", whatsapp: "WhatsApp", website: "Website", tax: "Tax No", registration: "Registration No", currency: "Currency", timezone: "Timezone", branches: "Branches",
    noData: "Not provided", noDrivers: "No drivers belong to this supplier.", noVehicles: "No vehicles belong to this supplier.", noOperations: "No transfers are assigned to this supplier.", noDocuments: "No document records are available for this supplier yet.", noActivity: "No activity records yet.",
    driver: "Driver", vehicle: "Vehicle", plate: "Plate", assignment: "Vehicle Assignment", active: "Active", passive: "Inactive", booking: "Booking", passenger: "Passenger", pickup: "Pickup", dropoff: "Dropoff", date: "Date", amount: "Amount", operationStatus: "Operation Status",
    totalTransfers: "Total Transfers", activeTransfers: "Active Operations", completed: "Completed", recordedSales: "Recorded Sales", financeNote: "This summary is calculated only from real booking prices stored in the system.",
    branchesTitle: "Branches & Locations", complianceTitle: "Document Status", activityTitle: "Approval & Activity Log", action: "Action", changedBy: "Changed By", note: "Note", notConnected: "The document management data source has not yet been connected for this supplier.",
  },
  ar: {
    eyebrow: "مركز تفاصيل المورد", close: "إغلاق", loading: "جارٍ تحميل تفاصيل المورد...", loadError: "تعذر تحميل تفاصيل المورد.",
    overview: "نظرة عامة", drivers: "السائقون", vehicles: "المركبات", operations: "العمليات", finance: "المالية", documents: "المستندات والامتثال", activity: "سجل النشاط",
    operational: "تشغيلي", closed: "مغلق", approved: "معتمد", status: "الحالة", location: "الموقع", contact: "جهة الاتصال", email: "البريد", phone: "الهاتف", whatsapp: "واتساب", website: "الموقع الإلكتروني", tax: "الرقم الضريبي", registration: "رقم التسجيل", currency: "العملة", timezone: "المنطقة الزمنية", branches: "الفروع",
    noData: "غير محدد", noDrivers: "لا يوجد سائقون تابعون لهذا المورد.", noVehicles: "لا توجد مركبات تابعة لهذا المورد.", noOperations: "لا توجد رحلات معينة لهذا المورد.", noDocuments: "لا توجد مستندات مسجلة لهذا المورد بعد.", noActivity: "لا يوجد سجل نشاط بعد.",
    driver: "السائق", vehicle: "المركبة", plate: "اللوحة", assignment: "تعيين المركبة", active: "نشط", passive: "غير نشط", booking: "الحجز", passenger: "الراكب", pickup: "الاستلام", dropoff: "التوصيل", date: "التاريخ", amount: "المبلغ", operationStatus: "حالة العملية",
    totalTransfers: "إجمالي الرحلات", activeTransfers: "العمليات النشطة", completed: "المكتملة", recordedSales: "المبيعات المسجلة", financeNote: "يتم حساب هذا الملخص فقط من أسعار الحجوزات الحقيقية المسجلة في النظام.",
    branchesTitle: "الفروع والمواقع", complianceTitle: "حالة المستندات", activityTitle: "سجل الاعتماد والنشاط", action: "الإجراء", changedBy: "تم بواسطة", note: "ملاحظة", notConnected: "لم يتم ربط مصدر بيانات إدارة المستندات لهذا المورد بعد.",
  },
  es: {
    eyebrow: "CENTRO DE DETALLE DEL PROVEEDOR", close: "Cerrar", loading: "Cargando detalles del proveedor...", loadError: "No se pudieron cargar los detalles del proveedor.",
    overview: "Resumen", drivers: "Conductores", vehicles: "Vehículos", operations: "Operaciones", finance: "Finanzas", documents: "Documentos y Cumplimiento", activity: "Registro de Actividad",
    operational: "Operativo", closed: "Cerrado", approved: "Aprobado", status: "Estado", location: "Ubicación", contact: "Contacto", email: "Correo", phone: "Teléfono", whatsapp: "WhatsApp", website: "Sitio web", tax: "N.º fiscal", registration: "N.º de registro", currency: "Moneda", timezone: "Zona horaria", branches: "Sucursales",
    noData: "No indicado", noDrivers: "No hay conductores asociados a este proveedor.", noVehicles: "No hay vehículos asociados a este proveedor.", noOperations: "No hay traslados asignados a este proveedor.", noDocuments: "Aún no hay documentos registrados para este proveedor.", noActivity: "Aún no hay registros de actividad.",
    driver: "Conductor", vehicle: "Vehículo", plate: "Matrícula", assignment: "Asignación de Vehículo", active: "Activo", passive: "Inactivo", booking: "Reserva", passenger: "Pasajero", pickup: "Recogida", dropoff: "Destino", date: "Fecha", amount: "Importe", operationStatus: "Estado Operativo",
    totalTransfers: "Traslados Totales", activeTransfers: "Operaciones Activas", completed: "Completados", recordedSales: "Ventas Registradas", financeNote: "Este resumen se calcula únicamente con precios reales de reservas guardados en el sistema.",
    branchesTitle: "Sucursales y Ubicaciones", complianceTitle: "Estado de Documentos", activityTitle: "Registro de Aprobación y Actividad", action: "Acción", changedBy: "Realizado por", note: "Nota", notConnected: "La fuente de datos de gestión documental aún no está conectada para este proveedor.",
  },
};

const ACTIVE_STATUSES = ["accepted", "on_the_way", "arrived", "passenger_called", "passenger_on_board", "trip_started"];

export default function SupplierDetailCenter({ supplierId, drivers = [], vehicles = [], onClose }) {
  const { language } = useLanguage();
  const text = TEXT[language] || TEXT.en;
  const [supplier, setSupplier] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [detail, transferResponse] = await Promise.all([
          supplierService.getSupplier(supplierId),
          transferService.getDispatcherTransfers(),
        ]);
        if (!mounted) return;
        setSupplier(detail);
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
  }, [supplierId]);

  const supplierDrivers = useMemo(() => drivers.filter((item) => Number(item.supplier_id || item.supplier_company?.id) === Number(supplierId)), [drivers, supplierId]);
  const supplierVehicles = useMemo(() => vehicles.filter((item) => Number(item.supplier_id || item.supplier_company?.id) === Number(supplierId)), [vehicles, supplierId]);
  const finance = useMemo(() => {
    const completed = transfers.filter((item) => item.status === "completed").length;
    const active = transfers.filter((item) => ACTIVE_STATUSES.includes(item.status)).length;
    const sales = transfers.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    return { completed, active, sales };
  }, [transfers]);

  const tabs = ["overview", "drivers", "vehicles", "operations", "finance", "documents", "activity"];

  return (
    <div className="supplier-detail-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <section className="supplier-detail-center" role="dialog" aria-modal="true">
        <header className="supplier-detail-header">
          <div>
            <small>{text.eyebrow}</small>
            <h2>{supplier?.company_name || "Supplier"}</h2>
            <p>{formatLocation(supplier) || text.noData}</p>
          </div>
          <div className="supplier-detail-header-side">
            {supplier && <span className={`supplier-detail-operation ${supplier.is_active ? "is-open" : "is-closed"}`}>{supplier.is_active ? text.operational : text.closed}</span>}
            <button type="button" onClick={onClose}>× {text.close}</button>
          </div>
        </header>

        <nav className="supplier-detail-tabs">
          {tabs.map((item) => <button key={item} type="button" className={tab === item ? "is-active" : ""} onClick={() => setTab(item)}>{text[item]}</button>)}
        </nav>

        <div className="supplier-detail-body">
          {loading && <div className="supplier-detail-state">{text.loading}</div>}
          {error && <div className="supplier-detail-state error">{error}</div>}
          {!loading && !error && supplier && (
            <>
              {tab === "overview" && <Overview supplier={supplier} text={text} drivers={supplierDrivers.length} vehicles={supplierVehicles.length} transfers={transfers.length} />}
              {tab === "drivers" && <Drivers rows={supplierDrivers} text={text} />}
              {tab === "vehicles" && <Vehicles rows={supplierVehicles} text={text} />}
              {tab === "operations" && <Operations rows={transfers} text={text} language={language} />}
              {tab === "finance" && <Finance supplier={supplier} transfers={transfers.length} finance={finance} text={text} />}
              {tab === "documents" && <Documents supplier={supplier} text={text} />}
              {tab === "activity" && <Activity supplier={supplier} text={text} language={language} />}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function Overview({ supplier, text, drivers, vehicles, transfers }) {
  return <div className="supplier-detail-stack">
    <div className="supplier-detail-kpis"><MiniKpi label={text.drivers} value={drivers}/><MiniKpi label={text.vehicles} value={vehicles}/><MiniKpi label={text.totalTransfers} value={transfers}/><MiniKpi label={text.branches} value={supplier.branches?.length || supplier.branches_count || 0}/></div>
    <div className="supplier-detail-info-grid">
      <Info label={text.status} value={supplier.status}/><Info label={text.location} value={formatLocation(supplier)}/><Info label={text.contact} value={supplier.contact_name}/><Info label={text.email} value={supplier.email}/><Info label={text.phone} value={supplier.phone}/><Info label={text.whatsapp} value={supplier.whatsapp}/><Info label={text.website} value={supplier.website}/><Info label={text.tax} value={supplier.tax_number}/><Info label={text.registration} value={supplier.registration_number}/><Info label={text.currency} value={supplier.default_currency}/><Info label={text.timezone} value={supplier.timezone}/><Info label={text.branches} value={supplier.branches?.length || supplier.branches_count || 0}/>
    </div>
  </div>;
}

function Drivers({ rows, text }) {
  if (!rows.length) return <div className="supplier-detail-state">{text.noDrivers}</div>;
  return <div className="supplier-detail-table-wrap"><table><thead><tr><th>{text.driver}</th><th>{text.phone}</th><th>{text.email}</th><th>{text.assignment}</th><th>{text.status}</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.phone || "—"}</td><td>{item.email || "—"}</td><td>{item.vehicle?.plate || item.vehicle_plate || "—"}</td><td>{item.is_active ? text.active : text.passive}</td></tr>)}</tbody></table></div>;
}

function Vehicles({ rows, text }) {
  if (!rows.length) return <div className="supplier-detail-state">{text.noVehicles}</div>;
  return <div className="supplier-detail-table-wrap"><table><thead><tr><th>{text.plate}</th><th>{text.vehicle}</th><th>{text.status}</th><th>Capacity</th><th>Insurance</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td><strong>{item.plate}</strong></td><td>{[item.brand,item.model].filter(Boolean).join(" ") || "—"}</td><td>{item.is_active ? text.active : text.passive}</td><td>{item.passenger_capacity ?? "—"}</td><td>{item.insurance_expiry_date || "—"}</td></tr>)}</tbody></table></div>;
}

function Operations({ rows, text, language }) {
  if (!rows.length) return <div className="supplier-detail-state">{text.noOperations}</div>;
  return <div className="supplier-detail-table-wrap"><table><thead><tr><th>{text.booking}</th><th>{text.passenger}</th><th>{text.date}</th><th>{text.pickup}</th><th>{text.dropoff}</th><th>{text.amount}</th><th>{text.operationStatus}</th></tr></thead><tbody>{rows.slice(0,50).map((item) => <tr key={item.id}><td><strong>{item.booking_reference || item.ota_booking_reference || `#${item.id}`}</strong></td><td>{item.passenger_name || "—"}</td><td>{formatDate(item.pickup_time, language)}</td><td>{item.pickup_address || item.pickup_location?.name || "—"}</td><td>{item.dropoff_address || item.dropoff_location?.name || "—"}</td><td>{item.price != null ? `${item.price} ${item.currency || ""}` : "—"}</td><td>{item.status || "—"}</td></tr>)}</tbody></table></div>;
}

function Finance({ supplier, transfers, finance, text }) {
  return <div className="supplier-detail-stack"><div className="supplier-detail-kpis"><MiniKpi label={text.totalTransfers} value={transfers}/><MiniKpi label={text.activeTransfers} value={finance.active}/><MiniKpi label={text.completed} value={finance.completed}/><MiniKpi label={text.recordedSales} value={`${finance.sales.toFixed(2)} ${supplier.default_currency || ""}`}/></div><div className="supplier-detail-note">{text.financeNote}</div></div>;
}

function Documents({ supplier, text }) {
  const branches = Array.isArray(supplier.branches) ? supplier.branches : [];
  return <div className="supplier-detail-stack"><section className="supplier-detail-section"><h3>{text.branchesTitle}</h3>{branches.length ? <div className="supplier-branch-grid">{branches.map((item) => <article key={item.id}><strong>{item.name || item.city || "Branch"}</strong><span>{[item.city,item.country_name || item.country_code].filter(Boolean).join(", ") || item.address || "—"}</span></article>)}</div> : <div className="supplier-detail-state">{text.noData}</div>}</section><section className="supplier-detail-section"><h3>{text.complianceTitle}</h3><div className="supplier-detail-note">{text.notConnected}</div></section></div>;
}

function Activity({ supplier, text, language }) {
  const rows = Array.isArray(supplier.approval_logs) ? supplier.approval_logs : [];
  if (!rows.length) return <div className="supplier-detail-state">{text.noActivity}</div>;
  return <div className="supplier-detail-table-wrap"><table><thead><tr><th>{text.date}</th><th>{text.action}</th><th>{text.status}</th><th>{text.changedBy}</th><th>{text.note}</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td>{formatDate(item.created_at, language, true)}</td><td>{item.action || "—"}</td><td>{item.old_status && item.new_status ? `${item.old_status} → ${item.new_status}` : item.new_status || "—"}</td><td>{item.changed_by?.name || item.changedBy?.name || "—"}</td><td>{item.note || item.reason || "—"}</td></tr>)}</tbody></table></div>;
}

function MiniKpi({ label, value }) { return <article className="supplier-detail-mini-kpi"><span>{label}</span><strong>{value}</strong></article>; }
function Info({ label, value }) { return <div className="supplier-detail-info"><span>{label}</span><strong>{value || "—"}</strong></div>; }
function formatLocation(item) { return item ? [item.city,item.country_name || item.country_code].filter(Boolean).join(", ") : ""; }
function formatDate(value, language, withTime=false) { if (!value) return "—"; const date=new Date(value); if(Number.isNaN(date.getTime())) return value; const locale=language==="tr"?"tr-TR":language==="ar"?"ar-SA":language==="es"?"es-ES":"en-GB"; return date.toLocaleString(locale, withTime?{dateStyle:"short",timeStyle:"short"}:{dateStyle:"short"}); }

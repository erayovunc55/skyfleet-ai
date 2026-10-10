import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { PAGES } from "../constants/pages";
import { getAdminDashboard } from "../services/dashboardService";

const COPY = {
  tr: {
    loading:"Kontrol merkezi yükleniyor...", loadError:"Dashboard yüklenemedi", retry:"Tekrar Dene",
    fallbackError:"Dashboard bilgileri yüklenemedi.", title:"Yönetici Kontrol Merkezi",
    subtitle:"Operasyon, finans ve tedarikçi ağınızı tek ekrandan izleyin.", live:"Sistem Canlı",
    refresh:"Verileri Yenile", refreshing:"Yenileniyor...", today:"Bugünkü Transfer",
    unassigned:n=>`${n} sürücüsüz operasyon`, waiting:"Bekleyen", waitingDetail:"Atama veya operasyon bekliyor",
    active:"Aktif Operasyon", activeDetail:"Şu anda sahada", completed:"Tamamlanan",
    completion:n=>`%${n} tamamlama oranı`, cancelled:"İptal", cancelledDetail:"Bugünkü iptal edilen işler",
    financeEye:"FİNANSAL PERFORMANS", financeTitle:"Bugünkü Ticari Özet",
    financeDesc:"Brüt satış, tedarikçi hakedişi ve platform marjı.", gross:"Brüt Satış",
    payable:"Tedarikçi Hakedişi", margin:"Skyfleet Marjı", networkEye:"GLOBAL NETWORK",
    networkTitle:"Operasyon Ağı", networkDesc:"Aktif kapasite ve tedarikçi büyüklüğü.",
    drivers:"Aktif Sürücü", vehicles:"Aktif Araç", suppliers:"Onaylı Tedarikçi",
    manageSuppliers:"Tedarikçi ağını yönet →", alertsEye:"AI OPERATIONS WATCH",
    alertsTitle:"Operasyon Uyarıları", alertsDesc:"Müdahale gerektiren durumların canlı özeti.",
    openLive:"Canlı operasyonları aç →", trendEye:"7 GÜNLÜK TREND", activity:"Transfer Aktivitesi",
    activityDesc:"Toplam ve tamamlanan transfer performansı.", total:"Toplam", chartCompleted:"Tamamlanan",
    totalTip:n=>`${n} toplam`, completedTip:n=>`${n} tamamlanan`, upcomingEye:"YAKLAŞAN OPERASYONLAR",
    upcomingTitle:"Sonraki Transferler", upcomingDesc:n=>`${n} yaklaşan rezervasyon gösteriliyor.`,
    allTransfers:"Tüm transferler →", noUpcoming:"Yaklaşan transfer bulunmuyor.", booking:"Rezervasyon",
    dateTime:"Tarih ve Saat", passenger:"Yolcu", route:"Güzergâh", supplier:"Tedarikçi",
    driverVehicle:"Sürücü / Araç", status:"Durum", unspecified:"Belirtilmedi", notAssigned:"Atanmadı",
    noVehicle:"Araç yok", unknown:"Bilinmiyor", waitingUpdate:"Güncelleme bekleniyor",
    lastUpdate:x=>`Son güncelleme ${x}`, noDate:"Tarih yok", noAddress:"Adres belirtilmedi",
    statusMap:{pending:"Bekliyor",accepted:"Kabul Edildi",assigned:"Atandı",on_the_way:"Yola Çıktı",arrived:"Alış Noktasında",passenger_called:"Yolcu Arandı",passenger_on_board:"Yolcu Araçta",trip_started:"Yolculuk Başladı",completed:"Tamamlandı",cancelled:"İptal",no_show:"No Show"},
    alertMap:{unassigned_upcoming:"Önümüzdeki 6 saat içinde sürücüsü olmayan işler.",overdue_pending:"Alış zamanı geçtiği halde açık kalan rezervasyonlar.",gps_attention:"Son 10 dakikada güncel konum göndermeyen operasyonlar."},
    alertTitles:{unassigned_upcoming:"Yaklaşan sürücüsüz transfer",overdue_pending:"Zamanı geçmiş bekleyen iş",gps_attention:"GPS kontrolü gereken operasyon"},
  },
  en: {
    loading:"Loading control center...", loadError:"Dashboard could not be loaded", retry:"Try Again",
    fallbackError:"Dashboard information could not be loaded.", title:"Executive Control Center",
    subtitle:"Monitor operations, finance and your supplier network from one screen.", live:"System Live",
    refresh:"Refresh Data", refreshing:"Refreshing...", today:"Today's Transfers",
    unassigned:n=>`${n} unassigned operations`, waiting:"Waiting", waitingDetail:"Awaiting assignment or operation",
    active:"Active Operations", activeDetail:"Currently in the field", completed:"Completed",
    completion:n=>`${n}% completion rate`, cancelled:"Cancelled", cancelledDetail:"Today's cancelled jobs",
    financeEye:"FINANCIAL PERFORMANCE", financeTitle:"Today's Commercial Summary",
    financeDesc:"Gross sales, supplier payable and platform margin.", gross:"Gross Sales",
    payable:"Supplier Payable", margin:"Skyfleet Margin", networkEye:"GLOBAL NETWORK",
    networkTitle:"Operations Network", networkDesc:"Active capacity and supplier network size.",
    drivers:"Active Drivers", vehicles:"Active Vehicles", suppliers:"Approved Suppliers",
    manageSuppliers:"Manage supplier network →", alertsEye:"AI OPERATIONS WATCH",
    alertsTitle:"Operations Alerts", alertsDesc:"Live summary of situations requiring attention.",
    openLive:"Open live operations →", trendEye:"7-DAY TREND", activity:"Transfer Activity",
    activityDesc:"Total and completed transfer performance.", total:"Total", chartCompleted:"Completed",
    totalTip:n=>`${n} total`, completedTip:n=>`${n} completed`, upcomingEye:"UPCOMING OPERATIONS",
    upcomingTitle:"Next Transfers", upcomingDesc:n=>`${n} upcoming reservations displayed.`,
    allTransfers:"All transfers →", noUpcoming:"No upcoming transfers.", booking:"Booking",
    dateTime:"Date & Time", passenger:"Passenger", route:"Route", supplier:"Supplier",
    driverVehicle:"Driver / Vehicle", status:"Status", unspecified:"Not specified", notAssigned:"Unassigned",
    noVehicle:"No vehicle", unknown:"Unknown", waitingUpdate:"Waiting for update",
    lastUpdate:x=>`Last update ${x}`, noDate:"No date", noAddress:"Address not specified",
    statusMap:{pending:"Waiting",accepted:"Accepted",assigned:"Assigned",on_the_way:"On the Way",arrived:"At Pickup",passenger_called:"Passenger Called",passenger_on_board:"Passenger On Board",trip_started:"Trip Started",completed:"Completed",cancelled:"Cancelled",no_show:"No Show"},
    alertMap:{unassigned_upcoming:"Jobs without an assigned driver in the next 6 hours.",overdue_pending:"Open reservations whose pickup time has already passed.",gps_attention:"Operations without a location update in the last 10 minutes."},
    alertTitles:{unassigned_upcoming:"Upcoming unassigned transfers",overdue_pending:"Overdue pending jobs",gps_attention:"Operations requiring GPS attention"},
  },
  es: {
    loading:"Cargando centro de control...", loadError:"No se pudo cargar el panel", retry:"Intentar de nuevo",
    fallbackError:"No se pudo cargar la información del panel.", title:"Centro de Control Ejecutivo",
    subtitle:"Supervise operaciones, finanzas y su red de proveedores desde una sola pantalla.", live:"Sistema Activo",
    refresh:"Actualizar Datos", refreshing:"Actualizando...", today:"Traslados de Hoy",
    unassigned:n=>`${n} operaciones sin conductor`, waiting:"En Espera", waitingDetail:"Pendiente de asignación u operación",
    active:"Operaciones Activas", activeDetail:"Actualmente en servicio", completed:"Completados",
    completion:n=>`${n}% de finalización`, cancelled:"Cancelados", cancelledDetail:"Servicios cancelados hoy",
    financeEye:"RENDIMIENTO FINANCIERO", financeTitle:"Resumen Comercial de Hoy",
    financeDesc:"Ventas brutas, pago a proveedores y margen de la plataforma.", gross:"Ventas Brutas",
    payable:"Pago a Proveedores", margin:"Margen Skyfleet", networkEye:"RED GLOBAL",
    networkTitle:"Red de Operaciones", networkDesc:"Capacidad activa y tamaño de la red de proveedores.",
    drivers:"Conductores Activos", vehicles:"Vehículos Activos", suppliers:"Proveedores Aprobados",
    manageSuppliers:"Gestionar red de proveedores →", alertsEye:"VIGILANCIA DE OPERACIONES IA",
    alertsTitle:"Alertas de Operaciones", alertsDesc:"Resumen en vivo de situaciones que requieren atención.",
    openLive:"Abrir operaciones en vivo →", trendEye:"TENDENCIA DE 7 DÍAS", activity:"Actividad de Traslados",
    activityDesc:"Rendimiento de traslados totales y completados.", total:"Total", chartCompleted:"Completados",
    totalTip:n=>`${n} total`, completedTip:n=>`${n} completados`, upcomingEye:"PRÓXIMAS OPERACIONES",
    upcomingTitle:"Próximos Traslados", upcomingDesc:n=>`Se muestran ${n} reservas próximas.`,
    allTransfers:"Todos los traslados →", noUpcoming:"No hay traslados próximos.", booking:"Reserva",
    dateTime:"Fecha y Hora", passenger:"Pasajero", route:"Ruta", supplier:"Proveedor",
    driverVehicle:"Conductor / Vehículo", status:"Estado", unspecified:"No especificado", notAssigned:"Sin asignar",
    noVehicle:"Sin vehículo", unknown:"Desconocido", waitingUpdate:"Esperando actualización",
    lastUpdate:x=>`Última actualización ${x}`, noDate:"Sin fecha", noAddress:"Dirección no especificada",
    statusMap:{pending:"En Espera",accepted:"Aceptado",assigned:"Asignado",on_the_way:"En Camino",arrived:"En el Punto de Recogida",passenger_called:"Pasajero Contactado",passenger_on_board:"Pasajero a Bordo",trip_started:"Viaje Iniciado",completed:"Completado",cancelled:"Cancelado",no_show:"No Show"},
    alertMap:{unassigned_upcoming:"Servicios sin conductor asignado en las próximas 6 horas.",overdue_pending:"Reservas abiertas cuya hora de recogida ya ha pasado.",gps_attention:"Operaciones sin actualización de ubicación en los últimos 10 minutos."},
    alertTitles:{unassigned_upcoming:"Próximos traslados sin conductor",overdue_pending:"Servicios pendientes vencidos",gps_attention:"Operaciones que requieren revisión GPS"},
  },
  ar: {
    loading:"جارٍ تحميل مركز التحكم...", loadError:"تعذر تحميل لوحة التحكم", retry:"إعادة المحاولة",
    fallbackError:"تعذر تحميل معلومات لوحة التحكم.", title:"مركز التحكم التنفيذي",
    subtitle:"راقب العمليات والمالية وشبكة الموردين من شاشة واحدة.", live:"النظام متصل",
    refresh:"تحديث البيانات", refreshing:"جارٍ التحديث...", today:"رحلات اليوم",
    unassigned:n=>`${n} عمليات بدون سائق`, waiting:"قيد الانتظار", waitingDetail:"بانتظار التعيين أو التنفيذ",
    active:"العمليات النشطة", activeDetail:"قيد التنفيذ حالياً", completed:"المكتملة",
    completion:n=>`نسبة الإكمال ${n}%`, cancelled:"الملغاة", cancelledDetail:"الرحلات الملغاة اليوم",
    financeEye:"الأداء المالي", financeTitle:"الملخص التجاري لليوم",
    financeDesc:"إجمالي المبيعات ومستحقات المورد وهامش المنصة.", gross:"إجمالي المبيعات",
    payable:"مستحقات المورد", margin:"هامش Skyfleet", networkEye:"الشبكة العالمية",
    networkTitle:"شبكة العمليات", networkDesc:"السعة النشطة وحجم شبكة الموردين.",
    drivers:"السائقون النشطون", vehicles:"المركبات النشطة", suppliers:"الموردون المعتمدون",
    manageSuppliers:"إدارة شبكة الموردين ←", alertsEye:"مراقبة العمليات بالذكاء الاصطناعي",
    alertsTitle:"تنبيهات العمليات", alertsDesc:"ملخص مباشر للحالات التي تتطلب التدخل.",
    openLive:"فتح العمليات المباشرة ←", trendEye:"اتجاه 7 أيام", activity:"نشاط الرحلات",
    activityDesc:"أداء إجمالي الرحلات والرحلات المكتملة.", total:"الإجمالي", chartCompleted:"المكتملة",
    totalTip:n=>`${n} إجمالي`, completedTip:n=>`${n} مكتملة`, upcomingEye:"العمليات القادمة",
    upcomingTitle:"الرحلات القادمة", upcomingDesc:n=>`يتم عرض ${n} حجوزات قادمة.`,
    allTransfers:"جميع الرحلات ←", noUpcoming:"لا توجد رحلات قادمة.", booking:"الحجز",
    dateTime:"التاريخ والوقت", passenger:"الراكب", route:"المسار", supplier:"المورد",
    driverVehicle:"السائق / المركبة", status:"الحالة", unspecified:"غير محدد", notAssigned:"غير معيّن",
    noVehicle:"لا توجد مركبة", unknown:"غير معروف", waitingUpdate:"بانتظار التحديث",
    lastUpdate:x=>`آخر تحديث ${x}`, noDate:"لا يوجد تاريخ", noAddress:"العنوان غير محدد",
    statusMap:{pending:"قيد الانتظار",accepted:"تم القبول",assigned:"تم التعيين",on_the_way:"في الطريق",arrived:"في نقطة الاستلام",passenger_called:"تم الاتصال بالراكب",passenger_on_board:"الراكب في المركبة",trip_started:"بدأت الرحلة",completed:"مكتملة",cancelled:"ملغاة",no_show:"لم يحضر"},
    alertMap:{unassigned_upcoming:"رحلات بدون سائق معيّن خلال الساعات الست القادمة.",overdue_pending:"حجوزات مفتوحة تجاوز وقت الاستلام الخاص بها.",gps_attention:"عمليات لم ترسل تحديثاً للموقع خلال آخر 10 دقائق."},
    alertTitles:{unassigned_upcoming:"رحلات قادمة بدون سائق",overdue_pending:"عمليات معلقة تجاوزت موعدها",gps_attention:"عمليات تتطلب مراجعة GPS"},
  },
};

const localeFor = l => ({tr:"tr-TR",en:"en-GB",es:"es-ES",ar:"ar-SA"}[l] || "tr-TR");
const normalizeLanguage = v => {
  const x=String(v||"tr").toLowerCase();
  if(x.startsWith("en")) return "en"; if(x.startsWith("es")) return "es"; if(x.startsWith("ar")) return "ar"; return "tr";
};
const storedLanguage = () => {
  try { return normalizeLanguage(localStorage.getItem("skyfleet_language")); } catch { return "tr"; }
};

export default function DashboardPage({ onNavigate }) {
  const [language,setLanguage]=useState(storedLanguage);
  const [dashboard,setDashboard]=useState(null);
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [error,setError]=useState("");
  const t=COPY[language]||COPY.tr;

  useEffect(()=>{
    const sync=()=>setLanguage(storedLanguage());
    window.addEventListener("storage",sync);
    window.addEventListener("skyfleet-language-change",sync);
    const timer=window.setInterval(sync,300);
    return()=>{window.removeEventListener("storage",sync);window.removeEventListener("skyfleet-language-change",sync);window.clearInterval(timer);};
  },[]);

  const loadDashboard=useCallback(async({silent=false}={})=>{
    silent?setRefreshing(true):setLoading(true); setError("");
    try{setDashboard(await getAdminDashboard());}
    catch(e){setError(e?.response?.data?.message||e?.message||COPY[storedLanguage()]?.fallbackError||COPY.tr.fallbackError);}
    finally{setLoading(false);setRefreshing(false);}
  },[]);

  useEffect(()=>{loadDashboard();const timer=window.setInterval(()=>loadDashboard({silent:true}),60000);return()=>window.clearInterval(timer);},[loadDashboard]);

  const weeklyMaximum=useMemo(()=>Math.max(1,...(dashboard?.weekly_activity||[]).map(x=>Number(x.total)||0)),[dashboard?.weekly_activity]);

  if(loading&&!dashboard) return <main className="executive-dashboard"><DashboardState>{t.loading}</DashboardState></main>;
  if(error&&!dashboard) return <main className="executive-dashboard"><DashboardState error><strong>{t.loadError}</strong><span>{error}</span><button type="button" onClick={()=>loadDashboard()}>{t.retry}</button></DashboardState></main>;

  const overview=dashboard?.overview||{}, network=dashboard?.network||{}, finance=dashboard?.finance||{};
  const alerts=dashboard?.alerts||[], upcomingTransfers=dashboard?.upcoming_transfers||[], weeklyActivity=dashboard?.weekly_activity||[];

  return <main className="executive-dashboard" dir={language==="ar"?"rtl":"ltr"}>
    <header className="executive-dashboard-header">
      <div><span className="executive-eyebrow">SKYFLEET INTELLIGENCE</span><h1>{t.title}</h1><p>{t.subtitle}</p></div>
      <div className="executive-header-actions">
        <div className="executive-live-state"><span/><div><strong>{t.live}</strong><small>{formatGeneratedTime(dashboard?.generated_at,language,t)}</small></div></div>
        <button type="button" className="executive-refresh-button" disabled={refreshing} onClick={()=>loadDashboard({silent:true})}>{refreshing?t.refreshing:t.refresh}</button>
      </div>
    </header>
    {error&&<div className="executive-inline-error">{error}</div>}
    <section className="executive-kpi-grid">
      <KpiCard tone="blue" label={t.today} value={overview.today_total||0} detail={t.unassigned(overview.unassigned||0)}/>
      <KpiCard tone="amber" label={t.waiting} value={overview.pending||0} detail={t.waitingDetail}/>
      <KpiCard tone="cyan" label={t.active} value={overview.active||0} detail={t.activeDetail}/>
      <KpiCard tone="green" label={t.completed} value={overview.completed||0} detail={t.completion(overview.completion_rate||0)}/>
      <KpiCard tone="red" label={t.cancelled} value={overview.cancelled||0} detail={t.cancelledDetail}/>
    </section>
    <section className="executive-content-grid">
      <article className="executive-panel executive-finance-panel">
        <PanelHeader eyebrow={t.financeEye} title={t.financeTitle} description={t.financeDesc}/>
        <div className="executive-finance-grid">
          <FinanceMetric label={t.gross} values={finance.gross_revenue} tone="primary" language={language}/>
          <FinanceMetric label={t.payable} values={finance.supplier_payable} tone="warning" language={language}/>
          <FinanceMetric label={t.margin} values={finance.platform_margin} tone="success" language={language}/>
        </div>
      </article>
      <article className="executive-panel executive-network-panel">
        <PanelHeader eyebrow={t.networkEye} title={t.networkTitle} description={t.networkDesc}/>
        <div className="executive-network-grid">
          <NetworkMetric icon="◉" label={t.drivers} value={network.active_drivers||0}/>
          <NetworkMetric icon="▣" label={t.vehicles} value={network.active_vehicles||0}/>
          <NetworkMetric icon="◆" label={t.suppliers} value={network.approved_suppliers||0}/>
        </div>
        <button type="button" className="executive-panel-link" onClick={()=>onNavigate?.(PAGES.SUPPLIERS)}>{t.manageSuppliers}</button>
      </article>
      <article className="executive-panel executive-alert-panel">
        <PanelHeader eyebrow={t.alertsEye} title={t.alertsTitle} description={t.alertsDesc}/>
        <div className="executive-alert-list">{alerts.map(alert=><div key={alert.key} className={`executive-alert-item ${alert.level}`}>
          <span className="executive-alert-dot"/><div><strong>{t.alertTitles[alert.key]||alert.title}</strong><small>{t.alertMap[alert.key]||""}</small></div><b>{alert.value}</b>
        </div>)}</div>
        <button type="button" className="executive-panel-link" onClick={()=>onNavigate?.(PAGES.LIVE_OPERATIONS)}>{t.openLive}</button>
      </article>
      <article className="executive-panel executive-chart-panel">
        <PanelHeader eyebrow={t.trendEye} title={t.activity} description={t.activityDesc}/>
        <div className="executive-chart-legend"><span><i className="total"/>{t.total}</span><span><i className="completed"/>{t.chartCompleted}</span></div>
        <div className="executive-bar-chart">{weeklyActivity.map(item=><div className="executive-chart-column" key={item.date}>
          <div className="executive-chart-values">
            <div className="executive-chart-bar total" style={{height:getBarHeight(item.total,weeklyMaximum)}} title={t.totalTip(item.total)}/>
            <div className="executive-chart-bar completed" style={{height:getBarHeight(item.completed,weeklyMaximum)}} title={t.completedTip(item.completed)}/>
          </div><strong>{item.total}</strong><span>{formatWeeklyLabel(item,language)}</span>
        </div>)}</div>
      </article>
    </section>
    <section className="executive-panel executive-upcoming-panel">
      <div className="executive-upcoming-header"><PanelHeader eyebrow={t.upcomingEye} title={t.upcomingTitle} description={t.upcomingDesc(upcomingTransfers.length)}/>
        <button type="button" className="executive-panel-link" onClick={()=>onNavigate?.(PAGES.TRANSFERS)}>{t.allTransfers}</button>
      </div>
      {upcomingTransfers.length===0?<div className="executive-empty-state">{t.noUpcoming}</div>:<div className="executive-table-wrap">
        <table className="executive-transfer-table"><thead><tr><th>{t.booking}</th><th>{t.dateTime}</th><th>{t.passenger}</th><th>{t.route}</th><th>{t.supplier}</th><th>{t.driverVehicle}</th><th>{t.status}</th></tr></thead>
        <tbody>{upcomingTransfers.map(transfer=><tr key={transfer.id}>
          <td><strong className="executive-reference">{transfer.booking_reference}</strong></td>
          <td>{formatDateTime(transfer.pickup_time,language,t)}</td><td>{transfer.passenger_name||t.unspecified}</td>
          <td><div className="executive-route"><span>{shortenText(transfer.pickup,t)}</span><b>→</b><span>{shortenText(transfer.dropoff,t)}</span></div></td>
          <td>{transfer.supplier_name||t.notAssigned}</td><td><strong>{transfer.driver_name||t.notAssigned}</strong><small>{transfer.vehicle_plate||t.noVehicle}</small></td>
          <td><span className={`executive-status ${transfer.status}`}>{t.statusMap[transfer.status]||transfer.status||t.unknown}</span></td>
        </tr>)}</tbody></table>
      </div>}
    </section>
  </main>;
}

function KpiCard({tone,label,value,detail}){return <article className={`executive-kpi-card ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;}
function PanelHeader({eyebrow,title,description}){return <header className="executive-panel-header"><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></header>;}
function FinanceMetric({label,values=[],tone,language}){const a=Array.isArray(values)?values:[];return <div className={`executive-finance-metric ${tone}`}><span>{label}</span>{a.length?a.map(i=><strong key={i.currency}>{formatMoney(i.amount,i.currency,language)}</strong>):<strong>{formatMoney(0,"EUR",language)}</strong>}</div>;}
function NetworkMetric({icon,label,value}){return <div className="executive-network-metric"><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></div>;}
function DashboardState({children,error=false}){return <section className={error?"executive-dashboard-state error":"executive-dashboard-state"}>{children}</section>;}
function formatGeneratedTime(value,l,t){if(!value)return t.waitingUpdate;const d=new Date(value);if(Number.isNaN(d.getTime()))return t.waitingUpdate;return t.lastUpdate(d.toLocaleTimeString(localeFor(l),{hour:"2-digit",minute:"2-digit"}));}
function formatDateTime(value,l,t){if(!value)return t.noDate;const d=new Date(value);if(Number.isNaN(d.getTime()))return t.noDate;return d.toLocaleString(localeFor(l),{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});}
function formatMoney(amount,currency="EUR",l="tr"){try{return new Intl.NumberFormat(localeFor(l),{style:"currency",currency:currency||"EUR"}).format(Number(amount)||0);}catch{return `${Number(amount||0).toFixed(2)} ${currency}`;}}
function formatWeeklyLabel(item,l){if(!item?.date)return item?.label||"";const d=new Date(`${item.date}T12:00:00`);return Number.isNaN(d.getTime())?(item?.label||""):d.toLocaleDateString(localeFor(l),{weekday:"short"});}
function getBarHeight(value,maximum){const n=Number(value)||0;if(n<=0)return"4px";return`${Math.max(12,Math.round((n/maximum)*150))}px`;}
function shortenText(value,t){const s=String(value||"").trim();if(!s)return t.noAddress;return s.length<=42?s:`${s.slice(0,42)}...`;}

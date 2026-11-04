import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../i18n";
import { convertTransferRequest, getTransferRequests, updateTransferRequestStatus } from "../services/transferRequestService";
import "../styles/transfer-requests.css";

const STATUSES = ["new", "contacted", "quoted", "confirmed", "rejected"];

const TEXT = {
  tr: { eyebrow: "WEB TALEPLERİ", title: "Transfer ve Tur Talepleri", subtitle: "Web sitesinden gelen transfer ve tur rezervasyon taleplerini inceleyin ve satış sürecini yönetin.", refresh: "Yenile", search: "Talep no, yolcu, telefon, e-posta veya rota ara...", all: "Tüm Durumlar", total: "Toplam", route: "Rota", travel: "Yolculuk", passenger: "Yolcu", received: "Alınma", status: "Durum", action: "İşlem", loading: "Talepler yükleniyor...", empty: "Filtrelere uygun transfer talebi bulunamadı.", error: "Transfer talepleri yüklenemedi.", saved: "Talep durumu güncellendi.", new: "Yeni", contacted: "İletişime Geçildi", quoted: "Fiyat Verildi", confirmed: "Onaylandı", rejected: "Reddedildi", pax: "yolcu", luggage: "bagaj", create: "Transfer Oluştur", created: "Transfer Oluşturuldu", convertTitle: "Talebi Operasyona Aktar", supplier: "Tedarikçi", price: "Fiyat", currency: "Para Birimi", vehicle: "Araç Tipi", cancel: "Vazgeç", converting: "Oluşturuluyor...", convertSuccess: "Operasyon transferi oluşturuldu", onlyConfirmed: "Önce talebi Onaylandı durumuna getirin.", tour: "Tur rezervasyonu", adults: "yetişkin", children: "çocuk", infants: "bebek", meetingPointPending: "Buluşma noktası teyit edilecek" },
  en: { eyebrow: "WEB REQUESTS", title: "Transfer & Tour Requests", subtitle: "Review booking requests from the public website and manage the sales workflow.", refresh: "Refresh", search: "Search reference, passenger, phone, email or route...", all: "All Statuses", total: "Total", route: "Route", travel: "Journey", passenger: "Passenger", received: "Received", status: "Status", action: "Action", loading: "Loading requests...", empty: "No transfer requests match these filters.", error: "Transfer requests could not be loaded.", saved: "Request status updated.", new: "New", contacted: "Contacted", quoted: "Quoted", confirmed: "Confirmed", rejected: "Rejected", pax: "passengers", luggage: "luggage", create: "Create Transfer", created: "Transfer Created", convertTitle: "Move Request to Operations", supplier: "Supplier", price: "Price", currency: "Currency", vehicle: "Vehicle Type", cancel: "Cancel", converting: "Creating...", convertSuccess: "Operational transfer created", onlyConfirmed: "Set the request to Confirmed first.", tour: "Tour reservation", adults: "adults", children: "children", infants: "infants", meetingPointPending: "Meeting point to be confirmed" },
  ar: { eyebrow: "طلبات الويب", title: "طلبات النقل", subtitle: "راجع طلبات الحجز الواردة من الموقع وأدر مسار المبيعات.", refresh: "تحديث", search: "ابحث برقم الطلب أو الراكب أو الهاتف أو البريد أو المسار...", all: "كل الحالات", total: "الإجمالي", route: "المسار", travel: "الرحلة", passenger: "الراكب", received: "تاريخ الاستلام", status: "الحالة", action: "الإجراء", loading: "جارٍ تحميل الطلبات...", empty: "لا توجد طلبات مطابقة.", error: "تعذر تحميل الطلبات.", saved: "تم تحديث حالة الطلب.", new: "جديد", contacted: "تم التواصل", quoted: "تم التسعير", confirmed: "مؤكد", rejected: "مرفوض", pax: "ركاب", luggage: "حقائب", create: "إنشاء رحلة", created: "تم إنشاء الرحلة", convertTitle: "نقل الطلب إلى العمليات", supplier: "المورد", price: "السعر", currency: "العملة", vehicle: "نوع المركبة", cancel: "إلغاء", converting: "جارٍ الإنشاء...", convertSuccess: "تم إنشاء رحلة العمليات", onlyConfirmed: "أكد الطلب أولاً.", tour: "حجز جولة", adults: "بالغون", children: "أطفال", infants: "رضّع", meetingPointPending: "سيتم تأكيد نقطة الالتقاء" },
  es: { eyebrow: "SOLICITUDES WEB", title: "Solicitudes de Traslado", subtitle: "Revisa las solicitudes del sitio web y gestiona el proceso comercial.", refresh: "Actualizar", search: "Buscar referencia, pasajero, teléfono, correo o ruta...", all: "Todos los estados", total: "Total", route: "Ruta", travel: "Viaje", passenger: "Pasajero", received: "Recibido", status: "Estado", action: "Acción", loading: "Cargando solicitudes...", empty: "No hay solicitudes que coincidan.", error: "No se pudieron cargar las solicitudes.", saved: "Estado actualizado.", new: "Nueva", contacted: "Contactado", quoted: "Cotizada", confirmed: "Confirmada", rejected: "Rechazada", pax: "pasajeros", luggage: "equipaje", create: "Crear Traslado", created: "Traslado Creado", convertTitle: "Pasar Solicitud a Operaciones", supplier: "Proveedor", price: "Precio", currency: "Moneda", vehicle: "Tipo de Vehículo", cancel: "Cancelar", converting: "Creando...", convertSuccess: "Traslado operativo creado", onlyConfirmed: "Confirma la solicitud primero.", tour: "Reserva de tour", adults: "adultos", children: "niños", infants: "bebés", meetingPointPending: "Punto de encuentro por confirmar" },
};

export default function TransferRequestsPage() {
  const { language } = useLanguage();
  const text = TEXT[language] || TEXT.en;
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [convertItem, setConvertItem] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await getTransferRequests({ status, search });
      setItems(Array.isArray(response.data) ? response.data : []);
      setCounts(response.counts || {});
    } catch (requestError) {
      setError(requestError.message || text.error);
    } finally {
      setLoading(false);
    }
  }

  // Status changes reload the server-side filtered list; search runs on submit.
  useEffect(() => {
    const timerId = window.setTimeout(() => { load(); }, 0);
    return () => window.clearTimeout(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function changeStatus(item, nextStatus) {
    setSavingId(item.id);
    setError("");
    setMessage("");
    try {
      await updateTransferRequestStatus(item.id, nextStatus);
      setMessage(text.saved);
      await load();
    } catch (requestError) {
      setError(requestError.message || text.error);
    } finally {
      setSavingId(null);
    }
  }

  const total = useMemo(() => Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0), [counts]);

  return <main className="request-page">
    <header className="request-header">
      <div><span>{text.eyebrow}</span><h1>{text.title}</h1><p>{text.subtitle}</p></div>
      <button type="button" onClick={load} disabled={loading}>↻ {text.refresh}</button>
    </header>

    <section className="request-kpis">
      <Kpi label={text.total} value={total} tone="total" />
      {STATUSES.slice(0, 4).map((key) => <Kpi key={key} label={text[key]} value={counts[key] || 0} tone={key} />)}
    </section>

    <section className="request-card">
      <div className="request-toolbar">
        <form onSubmit={(event) => { event.preventDefault(); load(); }}><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={text.search} /><button type="submit">⌕</button></form>
        <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">{text.all}</option>{STATUSES.map((key) => <option value={key} key={key}>{text[key]}</option>)}</select>
      </div>
      {error && <div className="request-message error">{error}</div>}
      {message && <div className="request-message success">{message}</div>}
      {loading ? <div className="request-empty">{text.loading}</div> : <div className="request-table-wrap"><table className="request-table">
        <thead><tr><th>Reference</th><th>{text.route}</th><th>{text.travel}</th><th>{text.passenger}</th><th>{text.received}</th><th>{text.status}</th><th>{text.action}</th></tr></thead>
        <tbody>{items.map((item) => <tr key={item.id}>
          <td><strong>{item.request_reference}</strong><small>{item.source}</small></td>
          <td>{item.request_type === "tour" ? <div className="request-route"><strong>{text.tour} · {item.tour_code}</strong><span>{item.tour_title}</span><small>{text.meetingPointPending}</small></div> : <div className="request-route"><span>{item.pickup}</span><b>↓</b><span>{item.dropoff}</span></div>}</td>
          <td><strong>{formatDate(item.pickup_date, language)} · {String(item.pickup_time || "").slice(0, 5)}</strong>{item.request_type === "tour" ? <small>{item.tour_adults} {text.adults} · {item.tour_children} {text.children} · {item.tour_infants} {text.infants}</small> : <small>{item.passengers} {text.pax} · {item.luggage_count} {text.luggage}</small>}{item.tour_price_total != null && <small>{item.tour_currency} {Number(item.tour_price_total).toFixed(2)}</small>}{item.flight_number && <small>✈ {item.flight_number}</small>}</td>
          <td><strong>{item.passenger_name}</strong><a href={`tel:${item.passenger_phone}`}>{item.passenger_phone}</a><a href={`mailto:${item.passenger_email}`}>{item.passenger_email}</a></td>
          <td><strong>{formatDateTime(item.created_at, language)}</strong><small>{item.locale?.toUpperCase()}</small></td>
          <td><select className={`request-status ${item.status}`} value={item.status} disabled={savingId === item.id} onChange={(event) => changeStatus(item, event.target.value)}>{STATUSES.map((key) => <option key={key} value={key}>{text[key]}</option>)}</select></td>
          <td>{item.request_type === "tour" ? <span className="request-converted">{text.tour}</span> : item.converted_at ? <span className="request-converted">✓ {text.created}<small>{item.transfer?.booking_reference || `#${item.transfer_id}`}</small></span> : <button className="request-convert-button" type="button" disabled={item.status !== "confirmed"} title={item.status !== "confirmed" ? text.onlyConfirmed : ""} onClick={() => setConvertItem(item)}>{text.create}</button>}</td>
        </tr>)}</tbody>
      </table>{!items.length && <div className="request-empty">{text.empty}</div>}</div>}
    </section>
    {convertItem && <ConversionModal item={convertItem} text={text} onClose={() => setConvertItem(null)} onSuccess={async (result) => { setConvertItem(null); setMessage(`${text.convertSuccess}: ${result.data.booking_reference}`); await load(); }} />}
  </main>;
}

function ConversionModal({ item, text, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError("");
    const data = new FormData(event.currentTarget);
    try {
      const result = await convertTransferRequest(item.id, {
        supplier: data.get("supplier"),
        price: data.get("price") === "" ? null : Number(data.get("price")),
        currency: data.get("currency"),
        vehicle_type: data.get("vehicle_type") || null,
      });
      await onSuccess(result);
    } catch (requestError) { setError(requestError.message); setSaving(false); }
  }
  return <div className="request-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="request-modal" onSubmit={submit}><h2>{text.convertTitle}</h2><p>{item.request_reference}</p><label><span>{text.supplier}</span><input name="supplier" defaultValue="Skytrip Transfer" required /></label><label><span>{text.price}</span><input name="price" type="number" min="0" step="0.01" /></label><label><span>{text.currency}</span><select name="currency" defaultValue="EUR"><option>EUR</option><option>USD</option><option>GBP</option><option>TRY</option></select></label><label><span>{text.vehicle}</span><input name="vehicle_type" defaultValue={item.vehicle_type || ""} /></label>{error && <div className="request-message error">{error}</div>}<div><button type="button" onClick={onClose} disabled={saving}>{text.cancel}</button><button type="submit" disabled={saving}>{saving ? text.converting : text.create}</button></div></form></div>;
}

function Kpi({ label, value, tone }) { return <article className={`request-kpi ${tone}`}><span>{label}</span><strong>{value}</strong></article>; }
function formatDate(value, language) { return value ? new Intl.DateTimeFormat(language, { dateStyle: "medium" }).format(new Date(value)) : "—"; }
function formatDateTime(value, language) { return value ? new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—"; }

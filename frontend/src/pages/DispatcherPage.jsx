import { useCallback, useEffect, useMemo, useState } from "react";
import TransferLiveMetrics from "../components/TransferLiveMetrics";
import DispatcherMap from "../components/DispatcherMap";
import echo from "../services/echo";
import { getDispatcherTransfers } from "../services/dispatcherService";
import "../styles/dispatcher.css";
import "../styles/control-tower.css";

const ACTIVE = new Set(["accepted", "assigned", "on_the_way", "arrived", "passenger_called", "passenger_on_board", "trip_started"]);
const FINISHED = new Set(["completed", "cancelled", "canceled", "no_show"]);
const LABELS = { pending: "Bekliyor", accepted: "Kabul edildi", assigned: "Atandı", on_the_way: "Yola çıktı", arrived: "Varış", passenger_called: "Yolcu arandı", passenger_on_board: "Yolcu araçta", trip_started: "Yolculuk başladı", completed: "Tamamlandı", no_show: "No-show", cancelled: "İptal", canceled: "İptal" };
const localDate = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
const dateValue = (value) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date; };
const timeLabel = (value) => dateValue(value)?.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) || "--:--";
const riskOf = (transfer, now) => {
  if (FINISHED.has(transfer.status)) return "none";
  const pickup = dateValue(transfer.pickup_time);
  if (!pickup) return "none";
  const minutes = (pickup.getTime() - now) / 60000;
  if (!transfer.driver_id && minutes <= 60 && minutes >= -120) return "critical";
  if (!transfer.driver_id && minutes <= 180 && minutes >= -120) return "warning";
  return "none";
};
const includesSearch = (transfer, query) => [transfer.booking_reference, transfer.ota_booking_reference, transfer.passenger_name, transfer.flight_number, transfer.pickup, transfer.dropoff, transfer.driver?.name, transfer.supplier_company?.name].some((value) => String(value || "").toLocaleLowerCase("tr-TR").includes(query));

export default function DispatcherPage({ onViewTransfer, onOpenFleet }) {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [date, setDate] = useState(() => localDate(new Date()));
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [now, setNow] = useState(Date.now());

  const reload = useCallback(async (silent = false) => {
    try {
      const data = await getDispatcherTransfers();
      setTransfers(Array.isArray(data) ? data : []);
      setError("");
      setLastUpdated(new Date());
    } catch (err) { setError(err?.message || "Transferler yüklenemedi."); }
    finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => {
    reload();
    const refresh = window.setInterval(() => reload(true), 10000);
    const clock = window.setInterval(() => setNow(Date.now()), 30000);
    return () => { window.clearInterval(refresh); window.clearInterval(clock); };
  }, [reload]);

  const selected = useMemo(() => transfers.find((t) => String(t.id) === String(selectedId)) || null, [transfers, selectedId]);
  useEffect(() => {
    if (!selectedId) return undefined;
    const channel = `transfer.${selectedId}`;
    echo.channel(channel).listen(".driver.location.updated", (location) => {
      setTransfers((items) => items.map((item) => String(item.id) === String(location.transfer_id) ? { ...item, latest_location: { ...item.latest_location, ...location } } : item));
    });
    return () => echo.leave(channel);
  }, [selectedId]);

  const dayTransfers = useMemo(() => transfers.filter((t) => { const pickup = dateValue(t.pickup_time); return pickup && localDate(pickup) === date; }), [transfers, date]);
  const totals = useMemo(() => ({ total: dayTransfers.length, critical: dayTransfers.filter((t) => riskOf(t, now) === "critical").length, unassigned: dayTransfers.filter((t) => !t.driver_id && !FINISHED.has(t.status)).length, active: dayTransfers.filter((t) => ACTIVE.has(t.status)).length, completed: dayTransfers.filter((t) => t.status === "completed").length }), [dayTransfers, now]);
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");
    return dayTransfers.filter((t) => (!query || includesSearch(t, query)) && (filter === "all" || (filter === "critical" && riskOf(t, now) === "critical") || (filter === "unassigned" && !t.driver_id && !FINISHED.has(t.status)) || (filter === "active" && ACTIVE.has(t.status)) || (filter === "completed" && t.status === "completed")))
      .sort((a, b) => { const rank = { critical: 0, warning: 1, none: 2 }; return rank[riskOf(a, now)] - rank[riskOf(b, now)] || (dateValue(a.pickup_time)?.getTime() || 0) - (dateValue(b.pickup_time)?.getTime() || 0); });
  }, [dayTransfers, search, filter, now]);
  const chosen = selected && filtered.some((t) => t.id === selected.id) ? selected : filtered[0] || null;
  const selectTransfer = (transfer) => setSelectedId(transfer.id);
  const changeDay = (delta) => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + delta); setDate(localDate(d)); };

  return (
    <main className="ct-page">
      <header className="ct-header"><div><span className="ct-eyebrow">SKYFLEET · OPERASYON MERKEZİ</span><h1>Control Tower</h1></div><div className="ct-header-actions"><span className="ct-updated">{lastUpdated ? `Son güncelleme ${lastUpdated.toLocaleTimeString("tr-TR")}` : "Veri bekleniyor"}</span><button type="button" onClick={() => reload(true)}>↻ Yenile</button><button type="button" onClick={onOpenFleet}>Filo</button></div></header>
      <section className="ct-summary" aria-label="Seçili günün operasyon özeti">
        {[{ key: "all", label: "Transfer", value: totals.total }, { key: "critical", label: "Acil atama", value: totals.critical }, { key: "unassigned", label: "Sürücüsüz", value: totals.unassigned }, { key: "active", label: "Aktif", value: totals.active }, { key: "completed", label: "Tamamlandı", value: totals.completed }].map((item) => <button type="button" key={item.key} className={`ct-stat ${filter === item.key ? "ct-stat-active" : ""} ${item.key === "critical" && item.value ? "ct-stat-danger" : ""}`} onClick={() => setFilter(item.key)}><strong>{item.value}</strong><span>{item.label}</span></button>)}
      </section>
      <section className="ct-controls"><div className="ct-day"><button type="button" aria-label="Önceki gün" onClick={() => changeDay(-1)}>‹</button><input aria-label="Operasyon tarihi" type="date" value={date} onChange={(e) => setDate(e.target.value)} /><button type="button" aria-label="Sonraki gün" onClick={() => changeDay(1)}>›</button><button type="button" onClick={() => setDate(localDate(new Date()))}>Bugün</button></div><input className="ct-search" aria-label="Transfer ara" placeholder="Yolcu, uçuş, rezervasyon, adres, sürücü ara…" value={search} onChange={(e) => setSearch(e.target.value)} /><button type="button" className={showMap ? "ct-map-on" : ""} onClick={() => setShowMap((value) => !value)}>{showMap ? "Haritayı kapat" : "Haritayı aç"}</button></section>
      {error && <div className="ct-error" role="alert">{error} <button type="button" onClick={() => reload(true)}>Tekrar dene</button></div>}
      {loading ? <p className="ct-message">Operasyonlar yükleniyor…</p> : <section className="ct-workspace">
        <div className="ct-table-pane"><div className="ct-pane-heading"><strong>Transfer listesi</strong><span>{filtered.length} / {dayTransfers.length} kayıt · Kritik işler önce</span></div><div className="ct-table-scroll"><table className="ct-table"><thead><tr><th>Saat</th><th>Rezervasyon / Yolcu</th><th>Güzergâh</th><th>Uçuş</th><th>Sürücü / Araç</th><th>Durum</th><th>Öncelik</th></tr></thead><tbody>{filtered.map((t) => { const risk = riskOf(t, now); return <tr key={t.id} className={`${chosen?.id === t.id ? "ct-selected" : ""} ${risk === "critical" ? "ct-row-critical" : ""}`} onClick={() => selectTransfer(t)}><td className="ct-time">{timeLabel(t.pickup_time)}</td><td><strong>{t.booking_reference || `#${t.id}`}</strong><small>{t.passenger_name || "Yolcu yok"}</small></td><td className="ct-route" title={`${t.pickup || ""} → ${t.dropoff || ""}`}><strong>{t.pickup || "—"}</strong><small>→ {t.dropoff || "—"}</small></td><td>{t.flight_number || "—"}</td><td><strong>{t.driver?.name || "Atanmadı"}</strong><small>{t.driver?.vehicle?.plate || t.driver?.vehicle?.plate_number || ""}</small></td><td><span className="ct-status">{LABELS[t.status] || t.status || "—"}</span></td><td>{risk === "critical" ? <span className="ct-risk ct-risk-critical">ACİL</span> : risk === "warning" ? <span className="ct-risk ct-risk-warning">YAKLAŞAN</span> : <span className="ct-muted">—</span>}</td></tr>; })}</tbody></table>{!filtered.length && <p className="ct-message">Bu tarih ve filtre için transfer bulunamadı.</p>}</div></div>
        <aside className="ct-detail"><div className="ct-pane-heading"><strong>Hızlı operasyon</strong><span>Seçili transfer</span></div>{chosen ? <div className="ct-detail-body"><div className="ct-detail-title"><div><span className="ct-eyebrow">REZERVASYON</span><h2>{chosen.booking_reference || `#${chosen.id}`}</h2></div><span className="ct-status">{LABELS[chosen.status] || chosen.status}</span></div><div className="ct-detail-route"><strong>{timeLabel(chosen.pickup_time)} · {chosen.passenger_name || "Yolcu yok"}</strong><p>{chosen.pickup || "—"}</p><p>↓ {chosen.dropoff || "—"}</p></div><dl className="ct-facts"><div><dt>Uçuş</dt><dd>{chosen.flight_number || "—"}</dd></div><div><dt>Sürücü</dt><dd>{chosen.driver?.name || "Atanmadı"}</dd></div><div><dt>Tedarikçi</dt><dd>{chosen.supplier_company?.name || chosen.supplier || "—"}</dd></div><div><dt>Telefon</dt><dd>{chosen.passenger_phone || "—"}</dd></div></dl>{riskOf(chosen, now) === "critical" && <p className="ct-alert">⚠ Alış saatine yakın, sürücü atanmamış.</p>}<button className="ct-primary" type="button" onClick={() => onViewTransfer?.(chosen)}>Transfer detayları ve işlemler →</button>{chosen.passenger_phone && <a className="ct-secondary" href={`tel:${String(chosen.passenger_phone).replace(/[^+\d]/g, "")}`}>Yolcuyu ara</a>}<div className="ct-gps"><TransferLiveMetrics transfer={chosen} /></div>{showMap && <div className="ct-map"><DispatcherMap transfer={chosen} transfers={dayTransfers} onSelectTransfer={selectTransfer} /></div>}</div> : <p className="ct-message">Detay görüntülemek için transfer seçin.</p>}</aside>
      </section>}
    </main>
  );
}

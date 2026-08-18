import { useEffect, useMemo, useState } from "react";
import DriverTransferCard from "../components/DriverTransferCard";
import DriverTransferDetailPage from "./DriverTransferDetailPage";
import transferService from "../services/transferService";
import {
  listenForForegroundMessages,
  registerForPushNotifications,
} from "../services/firebaseMessagingService";

export default function DriverHomePage({ user, onLogout }) {
  const storageKey = `skyfleet_driver_notifications_${user?.id || "driver"}`;
  const [transfers, setTransfers] = useState([]);
  const [dashboard, setDashboard] = useState({ assigned: 0, ongoing: 0, waiting: 0, completedToday: 0 });
  const [notifications, setNotifications] = useState(() => readNotifications(storageKey));
  const [activeView, setActiveView] = useState("transfers");
  const [pushStatus, setPushStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  useEffect(() => {
    loadData(true);
    const intervalId = window.setInterval(() => loadData(false), 15000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let stopListening = () => {};

    listenForForegroundMessages((payload) => {
      const transferId = Number(payload?.data?.transfer_id || 0) || null;
      const item = {
        id: payload?.data?.type === "pickup_60_minutes" && transferId
          ? `pickup-60-${transferId}`
          : payload?.messageId || `firebase-${Date.now()}`,
        transferId,
        title: payload?.notification?.title || "Skyfleet bildirimi",
        message: payload?.notification?.body || "Yeni bildiriminiz var.",
        createdAt: new Date().toISOString(),
        read: false,
      };
      addNotification(item);
    }).then((unsubscribe) => { stopListening = unsubscribe; });

    if ("Notification" in window && Notification.permission === "granted") {
      registerForPushNotifications({ requestPermission: false })
        .then(() => setPushStatus("Bildirimler açık"))
        .catch(() => setPushStatus("Bildirim kaydı yenilenemedi"));
    }

    return () => stopListening();
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  async function loadData(showLoading) {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const [items, dashboardData] = await Promise.all([
        transferService.getAssignedTransfers(),
        transferService.getDashboard(),
      ]);
      const normalizedItems = Array.isArray(items) ? items : [];
      setTransfers(normalizedItems);
      setDashboard({
        assigned: dashboardData?.assigned ?? 0,
        ongoing: dashboardData?.ongoing ?? 0,
        waiting: dashboardData?.waiting ?? 0,
        completedToday: dashboardData?.completedToday ?? 0,
      });
      createPickupReminders(normalizedItems);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || "Transferler yüklenemedi.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  function addNotification(item) {
    setNotifications((current) => {
      if (current.some((existing) => existing.id === item.id)) return current;
      const updated = [item, ...current].slice(0, 100);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  }

  function createPickupReminders(items) {
    const now = Date.now();
    const eligibleStatuses = new Set(["pending", "assigned", "accepted"]);
    items.forEach((transfer) => {
      if (!eligibleStatuses.has(transfer.status)) return;
      const pickupDate = parseDate(transfer.pickup_time);
      if (!pickupDate) return;
      const minutesRemaining = Math.ceil((pickupDate.getTime() - now) / 60000);
      if (minutesRemaining <= 0 || minutesRemaining > 60) return;
      addNotification({
        id: `pickup-60-${transfer.id}`,
        transferId: transfer.id,
        title: "Alış saatine 60 dakika kaldı",
        message: `${transfer.booking_reference || `Transfer #${transfer.id}`} · ${transfer.pickup || "Alış noktası"}`,
        createdAt: new Date().toISOString(),
        read: false,
      });
    });
  }

  function handleTransferUpdated(updatedTransfer) {
    setSelectedTransfer(updatedTransfer);
    setTransfers((current) => current.map((item) => item.id === updatedTransfer.id ? updatedTransfer : item));
  }

  function markAllRead() {
    setNotifications((current) => {
      const updated = current.map((item) => ({ ...item, read: true }));
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  }

  function openNotification(notification) {
    setNotifications((current) => {
      const updated = current.map((item) => item.id === notification.id ? { ...item, read: true } : item);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
    const transfer = transfers.find((item) => item.id === notification.transferId);
    if (transfer) setSelectedTransfer(transfer);
  }

  async function enableBrowserNotifications() {
    setPushStatus("Bildirim açılıyor...");
    try {
      await registerForPushNotifications();
      setPushStatus("Bildirimler açık");
    } catch (requestError) {
      setPushStatus(requestError?.response?.data?.message || requestError?.message || "Bildirim açılamadı.");
    }
  }

  if (selectedTransfer) {
    return (
      <DriverTransferDetailPage
        user={user}
        initialTransfer={selectedTransfer}
        onBack={() => setSelectedTransfer(null)}
        onTransferUpdated={handleTransferUpdated}
      />
    );
  }

  return (
    <main className="driver-home-page">
      <header>
        <div><small>SKYFLEET AI</small><h1>Merhaba, {user?.name}</h1></div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button type="button" onClick={() => setActiveView("notifications")} style={{ position: "relative" }}>
            🔔 Bildirimler
            {unreadCount > 0 && <span style={{ marginLeft: "7px", padding: "2px 7px", borderRadius: "999px", background: "#dc2626", color: "#fff", fontWeight: 800 }}>{unreadCount}</span>}
          </button>
          <button type="button" onClick={onLogout}>Çıkış</button>
        </div>
      </header>

      {activeView === "transfers" && (
        <>
          <section className="driver-home-summary">
            <div className="driver-summary-grid">
              <Summary label="Atanmış" value={dashboard.assigned} />
              <Summary label="Devam Eden" value={dashboard.ongoing} />
              <Summary label="Bekleyen" value={dashboard.waiting} />
              <Summary label="Tamamlanan" value={dashboard.completedToday} />
            </div>
            <button type="button" disabled={loading} onClick={() => loadData(true)}>Yenile</button>
          </section>
          {loading && <div className="driver-page-state">Transferler yükleniyor...</div>}
          {error && <div className="driver-page-state error">{error}</div>}
          {!loading && !error && transfers.length === 0 && <div className="driver-empty-card"><strong>Atanmış transfer yok</strong><p>Yeni transfer atandığında burada görünecek.</p></div>}
          {!loading && !error && transfers.length > 0 && (
            <section className="driver-transfer-list">
              {transfers.map((transfer) => <DriverTransferCard key={transfer.id} transfer={transfer} onOpen={setSelectedTransfer} />)}
            </section>
          )}
        </>
      )}

      {activeView === "notifications" && (
        <section style={{ display: "grid", gap: "14px", marginTop: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div><small>SÜRÜCÜ UYARILARI</small><h2 style={{ margin: "5px 0 0" }}>Bildirimler</h2></div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {(!("Notification" in window) || Notification.permission !== "granted") && <button type="button" onClick={enableBrowserNotifications}>Bildirimleri Aç</button>}
              <button type="button" onClick={markAllRead}>Tümünü Okundu Yap</button>
              <button type="button" onClick={() => setActiveView("transfers")}>Transferlere Dön</button>
            </div>
          </div>
          {pushStatus && <div className="driver-page-state">{pushStatus}</div>}
          {notifications.length === 0 ? (
            <div className="driver-empty-card"><strong>Yeni bildirim yok</strong><p>Alış saatine 60 dakika kalan transferler burada görünecek.</p></div>
          ) : notifications.map((notification) => (
            <button key={notification.id} type="button" onClick={() => openNotification(notification)} style={{ textAlign: "left", padding: "16px", border: notification.read ? "1px solid #cbd5e1" : "2px solid #2563eb", borderRadius: "16px", background: notification.read ? "#fff" : "#eff6ff", color: "#0f172a" }}>
              <strong>{notification.title}</strong>
              <p style={{ margin: "6px 0" }}>{notification.message}</p>
              <small>{formatDateTime(notification.createdAt)}</small>
            </button>
          ))}
        </section>
      )}
    </main>
  );
}

function Summary({ label, value }) {
  return <div className="driver-summary-card"><span>{label}</span><strong>{value}</strong></div>;
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? null : date;
}

function readNotifications(key) {
  try {
    const items = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function formatDateTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

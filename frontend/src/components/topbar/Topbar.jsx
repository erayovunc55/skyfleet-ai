import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import operationAlertService from "../../services/operationAlertService";

const ALERT_TRANSFER_KEY =
  "skyfleet_pending_transfer_id";

export default function Topbar({
  user,
  onOpenMenu,
  onLogout,
  onNavigate,
}) {
  const userName =
    user?.name || "Eray Ovunc";

  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] =
    useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] =
    useState("all");

  const notificationRef = useRef(null);

  const loadAlerts = useCallback(async ({
    silent = false,
  } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const data =
        await operationAlertService
          .getAlerts();

      setAlerts(
        Array.isArray(data?.items)
          ? data.items
          : [],
      );
      setUnreadCount(
        Number(data?.unread_count || 0),
      );
      setError("");
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Operasyon bildirimleri alınamadı.",
      );
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadAlerts();

    const timer = window.setInterval(
      () => loadAlerts({ silent: true }),
      30000,
    );

    return () => window.clearInterval(timer);
  }, [loadAlerts]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target,
        )
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );
    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, []);

  const visibleAlerts = useMemo(
    () =>
      filter === "unread"
        ? alerts.filter(
            (alert) => !alert.is_read,
          )
        : alerts,
    [alerts, filter],
  );

  async function markAlertsRead(keys) {
    const uniqueKeys = [
      ...new Set(keys.filter(Boolean)),
    ];

    if (uniqueKeys.length === 0) {
      return;
    }

    setAlerts((current) =>
      current.map((alert) =>
        uniqueKeys.includes(alert.key)
          ? { ...alert, is_read: true }
          : alert,
      ),
    );

    setUnreadCount((current) =>
      Math.max(
        0,
        current -
          alerts.filter(
            (alert) =>
              uniqueKeys.includes(alert.key) &&
              !alert.is_read,
          ).length,
      ),
    );

    try {
      await operationAlertService
        .markRead(uniqueKeys);
    } catch (requestError) {
      loadAlerts({ silent: true });
    }
  }

  function handleAlertClick(alert) {
    markAlertsRead([alert.key]);
    setOpen(false);

    if (alert.transfer_id) {
      sessionStorage.setItem(
        ALERT_TRANSFER_KEY,
        String(alert.transfer_id),
      );

      window.dispatchEvent(
        new CustomEvent(
          "skyfleet:open-transfer",
          {
            detail: {
              transferId:
                alert.transfer_id,
            },
          },
        ),
      );
    }

    onNavigate?.(
      alert.target || "transfers",
    );
  }

  function markAllRead() {
    markAlertsRead(
      alerts
        .filter((alert) => !alert.is_read)
        .map((alert) => alert.key),
    );
  }

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        <button
          className="admin-mobile-menu-button"
          type="button"
          onClick={onOpenMenu}
          aria-label="Menüyü aç"
        >
          ☰
        </button>

        <div className="admin-search">
          <span>⌕</span>
          <input
            type="search"
            placeholder="Transfer, sürücü, plaka veya tedarikçi ara..."
          />
          <kbd>⌘ K</kbd>
        </div>
      </div>

      <div className="admin-topbar-actions">
        <div
          className="operation-notification-wrap"
          ref={notificationRef}
        >
          <button
            className={
              open
                ? "admin-topbar-action-button active"
                : "admin-topbar-action-button"
            }
            type="button"
            title="Operasyon bildirimleri"
            aria-label={`${unreadCount} okunmamış operasyon bildirimi`}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            🔔
            {unreadCount > 0 && (
              <span>
                {unreadCount > 99
                  ? "99+"
                  : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <section className="operation-notification-panel">
              <header className="operation-notification-header">
                <div>
                  <span>CANLI OPERASYON</span>
                  <h2>Bildirim Merkezi</h2>
                </div>

                <button
                  type="button"
                  disabled={unreadCount === 0}
                  onClick={markAllRead}
                >
                  Tümünü Okundu Yap
                </button>
              </header>

              <div className="operation-notification-toolbar">
                <div>
                  <button
                    type="button"
                    className={filter === "all" ? "active" : ""}
                    onClick={() => setFilter("all")}
                  >
                    Tümü
                  </button>
                  <button
                    type="button"
                    className={filter === "unread" ? "active" : ""}
                    onClick={() => setFilter("unread")}
                  >
                    Okunmamış
                  </button>
                </div>

                <button
                  className="operation-notification-refresh"
                  type="button"
                  disabled={loading}
                  onClick={() => loadAlerts()}
                  title="Bildirimleri yenile"
                >
                  ↻
                </button>
              </div>

              <div className="operation-notification-list">
                {loading && alerts.length === 0 && (
                  <NotificationState text="Bildirimler yükleniyor..." />
                )}

                {error && alerts.length === 0 && (
                  <NotificationState text={error} error />
                )}

                {!loading &&
                  !error &&
                  visibleAlerts.length === 0 && (
                    <NotificationState
                      text={
                        filter === "unread"
                          ? "Okunmamış bildiriminiz yok."
                          : "Aktif operasyon bildirimi yok."
                      }
                      success
                    />
                  )}

                {visibleAlerts.map((alert) => (
                  <button
                    key={alert.key}
                    type="button"
                    className={
                      `operation-notification-item ${alert.level} ` +
                      (alert.is_read ? "read" : "unread")
                    }
                    onClick={() => handleAlertClick(alert)}
                  >
                    <span className="operation-notification-icon">
                      {getAlertIcon(alert.icon)}
                    </span>

                    <span className="operation-notification-copy">
                      <strong>{alert.title}</strong>
                      <small>{alert.message}</small>
                      <span>
                        {formatRelativeTime(alert.occurred_at)}
                        {alert.booking_reference
                          ? ` · ${alert.booking_reference}`
                          : ""}
                      </span>
                    </span>

                    {!alert.is_read && (
                      <span className="operation-notification-unread-dot" />
                    )}
                  </button>
                ))}
              </div>

              <footer className="operation-notification-footer">
                <span>
                  Her 30 saniyede otomatik güncellenir
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.("transfers");
                  }}
                >
                  Transferleri Aç →
                </button>
              </footer>
            </section>
          )}
        </div>

        <button
          className="admin-topbar-action-button"
          type="button"
          title="Yardım"
        >
          ?
        </button>

        <div className="admin-user-menu">
          <div className="admin-user-avatar">
            {getInitials(userName)}
          </div>
          <div className="admin-user-details">
            <strong>{userName}</strong>
            <span>{getRoleLabel(user?.role)}</span>
          </div>
          <button
            className="admin-logout-button"
            type="button"
            onClick={onLogout}
          >
            Çıkış
          </button>
        </div>
      </div>
    </header>
  );
}

function NotificationState({
  text,
  error = false,
  success = false,
}) {
  return (
    <div
      className={
        "operation-notification-state" +
        (error ? " error" : "") +
        (success ? " success" : "")
      }
    >
      {success ? "✓" : error ? "!" : "…"}
      <span>{text}</span>
    </div>
  );
}

function getAlertIcon(icon) {
  const icons = {
    driver: "👤",
    clock: "⏱",
    gps: "📍",
    evidence: "📷",
    cancelled: "✕",
  };
  return icons[icon] || "●";
}

function formatRelativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Şimdi";
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 45) return "Şimdi";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
  });
}

function getInitials(name) {
  return String(name)
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getRoleLabel(role) {
  const labels = {
    super_admin: "Super Admin",
    admin: "Administrator",
    dispatcher: "Dispatcher",
    supplier_admin: "Supplier Admin",
    supplier_operator: "Supplier Operator",
    driver: "Driver",
    finance: "Finance",
    quality_controller: "Quality Controller",
  };
  return labels[role] || "Platform Admin";
}

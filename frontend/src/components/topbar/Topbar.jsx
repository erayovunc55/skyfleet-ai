export default function Topbar({
  user,
  onOpenMenu,
  onLogout,
}) {
  const userName =
    user?.name || "Eray Ovunc";

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
        <button
          className="admin-topbar-action-button"
          type="button"
          title="Bildirimler"
        >
          🔔
          <span>3</span>
        </button>

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
            <span>
              {getRoleLabel(user?.role)}
            </span>
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
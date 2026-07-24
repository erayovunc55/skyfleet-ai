const menuItems = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: "🏠",
  },
  {
    id: "live-operations",
    title: "Live Operations",
    icon: "🛰️",
  },
  {
    id: "transfers",
    title: "Transfers",
    icon: "📅",
  },
  {
    id: "fleet",
    title: "Fleet",
    icon: "🚐",
  },
  {
    id: "drivers",
    title: "Drivers",
    icon: "👤",
  },
  {
    id: "suppliers",
    title: "Suppliers",
    icon: "🏢",
  },
  {
    id: "locations",
    title: "Locations",
    icon: "🌍",
  },
  {
    id: "documents",
    title: "Documents",
    icon: "📄",
  },
  {
    id: "ratings",
    title: "Ratings",
    icon: "⭐",
  },
  {
    id: "finance",
    title: "Finance",
    icon: "💰",
  },
  {
    id: "ai-dispatcher",
    title: "AI Dispatcher",
    icon: "🤖",
  },
  {
    id: "settings",
    title: "Settings",
    icon: "⚙️",
  },
];

export default function Sidebar({
  activePage,
  onNavigate,
  isOpen,
  onClose,
}) {
  return (
    <>
      {isOpen && (
        <button
          className="admin-sidebar-overlay"
          type="button"
          aria-label="Menüyü kapat"
          onClick={onClose}
        />
      )}

      <aside
        className={
          isOpen
            ? "admin-sidebar open"
            : "admin-sidebar"
        }
      >
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-logo">
            SF
          </div>

          <div>
            <strong>SKYFLEET AI</strong>
            <span>Control Center</span>
          </div>
        </div>

        <nav className="admin-sidebar-navigation">
          <span className="admin-sidebar-section-label">
            PLATFORM
          </span>

          {menuItems.map((item) => (
            <button
              className={
                activePage === item.id
                  ? "admin-sidebar-item active"
                  : "admin-sidebar-item"
              }
              key={item.id}
              type="button"
              onClick={() => {
                onNavigate?.(item.id);
                onClose?.();
              }}
            >
              <span className="admin-sidebar-item-icon">
                {item.icon}
              </span>

              <span>{item.title}</span>

              {activePage === item.id && (
                <span className="admin-sidebar-active-dot" />
              )}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-system-status">
            <span className="admin-sidebar-status-dot" />

            <div>
              <strong>System Online</strong>
              <small>All services operational</small>
            </div>
          </div>

          <p>Every Transfer, Under Control.</p>
        </div>
      </aside>
    </>
  );
}
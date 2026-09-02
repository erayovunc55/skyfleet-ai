import { useState } from "react";

import Sidebar from "../components/sidebar/Sidebar";
import Topbar from "../components/topbar/Topbar";
import { LanguageSwitcher } from "../i18n.jsx";

export default function AdminLayout({
  activePage,
  onNavigate,
  user,
  onLogout,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  return (
    <div className="admin-layout">
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        isOpen={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="admin-layout-main">
        <div
          style={{
            position: "fixed",
            top: 12,
            right: 390,
            zIndex: 1200,
          }}
        >
          <LanguageSwitcher />
        </div>

        <Topbar
          user={user}
          onNavigate={onNavigate}
          onOpenMenu={() =>
            setSidebarOpen(true)
          }
          onLogout={onLogout}
        />

        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  );
}

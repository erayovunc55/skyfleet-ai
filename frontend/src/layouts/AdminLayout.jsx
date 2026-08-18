import { useState } from "react";

import Sidebar from "../components/sidebar/Sidebar";
import Topbar from "../components/topbar/Topbar";

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

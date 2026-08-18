import { useState } from "react";
import "./App.css";
import DriversPage from "./pages/DriversPage";
import DashboardPage from "./pages/DashboardPage";
import AdminLayout from "./layouts/AdminLayout";
import TransfersPage from "./pages/TransfersPage";
import FleetPage from "./pages/FleetPage";
import LoginPage from "./pages/LoginPage";
import ModulePlaceholderPage from "./pages/ModulePlaceholderPage";

import { TransferWorkspace } from "./modules/transfers";
import { SupplierPage } from "./modules/suppliers";

import { FinancePage } from "./modules/finance";

import { AdminInvoicesPage } from "./modules/invoices";

import { PAGES } from "./constants/pages";

import {
  getStoredUser,
  logout,
} from "./services/authService";

function App() {
  const [user, setUser] = useState(getStoredUser());
  const [currentPage, setCurrentPage] = useState(
    PAGES.LIVE_OPERATIONS,
  );

  function handleLogin(loggedInUser) {
    setUser(loggedInUser);
    setCurrentPage(PAGES.LIVE_OPERATIONS);
  }

  function handleLogout() {
    logout();
    setUser(null);
    setCurrentPage(PAGES.LIVE_OPERATIONS);
  }

  function handleNavigate(page) {
    setCurrentPage(page);
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <AdminLayout
      activePage={currentPage}
      onNavigate={handleNavigate}
      user={user}
      onLogout={handleLogout}
    >
      <PageContent
        currentPage={currentPage}
        onNavigate={handleNavigate}
      />
    </AdminLayout>
  );
}

function PageContent({ currentPage, onNavigate }) {
  switch (currentPage) {
    case PAGES.DASHBOARD:
  return (
    <DashboardPage
      onNavigate={onNavigate}
    />
  );

    case PAGES.LIVE_OPERATIONS:
      return <TransferWorkspace />;

    case PAGES.TRANSFERS:
  return <TransfersPage />;

    case PAGES.FLEET:
      return (
        <FleetPage
          onBack={() => onNavigate(PAGES.LIVE_OPERATIONS)}
        />
      );

    case PAGES.SUPPLIERS:
      return <SupplierPage />;

    case PAGES.DRIVERS:
  return <DriversPage />;
    case PAGES.LOCATIONS:
      return <ModulePlaceholderPage eyebrow="MASTER DATA" title="Locations" description="Ülke, şehir, havalimanı ve lokasyon yönetim ekranı hazırlanıyor." />;
    case PAGES.DOCUMENTS:
      return <AdminInvoicesPage />;
    case PAGES.RATINGS:
      return <ModulePlaceholderPage eyebrow="PERFORMANCE" title="Ratings" description="Tedarikçi performansı ve puanlama sistemi hazırlanıyor." />;
    case PAGES.FINANCE:
      return <FinancePage />;
    case PAGES.AI_DISPATCHER:
      return <ModulePlaceholderPage eyebrow="ARTIFICIAL INTELLIGENCE" title="AI Dispatcher" description="Akıllı atama ve operasyon öneri sistemi hazırlanıyor." />;
    case PAGES.SETTINGS:
      return <ModulePlaceholderPage eyebrow="PLATFORM" title="Settings" description="Platform ayarları ve yetkilendirme modülü hazırlanıyor." />;
    default:
      return <ModulePlaceholderPage title="Sayfa bulunamadı" description="Seçilen modül tanımlı değil." />;
  }
}

export default App;

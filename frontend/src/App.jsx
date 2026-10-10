import { AgencyPage }
from "./modules/agencies";
import { useState } from "react";
import "./App.css";
import DriversPage from "./pages/DriversPage";
import DashboardPage from "./pages/DashboardPage";
import AdminLayout from "./layouts/AdminLayout";
import TransfersPage from "./pages/TransfersPage";
import TransferRequestsPage from "./pages/TransferRequestsPage";
import LiveSupportPage from "./pages/LiveSupportPage";
import FleetPage from "./pages/FleetPage";
import AiTrainingPage from "./pages/AiTrainingPage";
import LocationsPage from "./pages/LocationsPage";
import LoginPage from "./pages/LoginPage";
import ModulePlaceholderPage from "./pages/ModulePlaceholderPage";
import DispatcherPage from "./pages/DispatcherPage";
import RatingsPage from "./pages/RatingsPage";
import SettingsPage from "./pages/SettingsPage";
import TourPackagesPage from "./pages/TourPackagesPage";

import { TransferWorkspace } from "./modules/transfers";
import { SupplierPage } from "./modules/suppliers";

import { FinancePage } from "./modules/finance";

import { AdminInvoicesPage } from "./modules/invoices";

import { PAGES } from "./constants/pages";
import { canAccessPage, firstAllowedPage } from "./constants/access";
import UsersPage from "./pages/UsersPage";

const LANDING_ORDER = [
  PAGES.LIVE_OPERATIONS,
  PAGES.DASHBOARD,
  PAGES.TRANSFERS,
  PAGES.TRANSFER_REQUESTS,
  PAGES.DRIVERS,
  PAGES.FLEET,
  PAGES.SUPPLIERS,
  PAGES.AGENCIES,
  PAGES.FINANCE,
  PAGES.LIVE_SUPPORT,
];

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
    setCurrentPage(firstAllowedPage(loggedInUser, LANDING_ORDER));
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

  const activePage = canAccessPage(user, currentPage)
    ? currentPage
    : firstAllowedPage(user, LANDING_ORDER);

  return (
    <AdminLayout
      activePage={activePage}
      onNavigate={handleNavigate}
      user={user}
      onLogout={handleLogout}
    >
      <PageContent
        currentPage={activePage}
        onNavigate={handleNavigate}
        user={user}
      />
    </AdminLayout>
  );
}

function PageContent({ currentPage, onNavigate, user }) {
  switch (currentPage) {
    case PAGES.DASHBOARD:
      return <DashboardPage onNavigate={onNavigate} />;
    case PAGES.LIVE_OPERATIONS:
      return <TransferWorkspace />;
      case PAGES.LIVE_SUPPORT:
  return <LiveSupportPage />;
    case PAGES.TRANSFERS:
      return <TransfersPage />;
    case PAGES.TRANSFER_REQUESTS:
      return <TransferRequestsPage />;
    case PAGES.FLEET:
      return <FleetPage onBack={() => onNavigate(PAGES.LIVE_OPERATIONS)} />;
    case PAGES.SUPPLIERS:
      return <SupplierPage />;
      case PAGES.AGENCIES:
  return <AgencyPage />;
    case PAGES.DRIVERS:
      return <DriversPage />;
    case PAGES.LOCATIONS:
      return <LocationsPage />;
    case PAGES.DOCUMENTS:
      return <AdminInvoicesPage />;
    case PAGES.RATINGS:
      return <RatingsPage />;
    case PAGES.FINANCE:
      return <FinancePage />;
    case PAGES.AI_DISPATCHER:
      return (
        <DispatcherPage
          onViewTransfer={(transfer) => {
            if (transfer?.id) {
              sessionStorage.setItem(
                "skyfleet_pending_transfer_id",
                String(transfer.id),
              );
            }

            onNavigate(PAGES.TRANSFERS);
          }}
          onOpenFleet={() => onNavigate(PAGES.FLEET)}
        />
      );
case PAGES.AI_TRAINING:
  return <AiTrainingPage />;
    case PAGES.USERS:
      return <UsersPage currentUser={user} />;
    case PAGES.SETTINGS:
      return <SettingsPage user={user} />;
    case PAGES.TOUR_PACKAGES:
      return <TourPackagesPage />;
    default:
      return <ModulePlaceholderPage title="Page not found" description="The selected module is not defined." />;
  }
}

export default App;



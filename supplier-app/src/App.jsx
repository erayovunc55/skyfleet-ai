import { useEffect, useState } from "react";
import "./App.css";
import SupplierAvailableJobsPage from "./pages/SupplierAvailableJobsPage";
import SupplierDashboardPage from "./pages/SupplierDashboardPage";
import SupplierDriversPage from "./pages/SupplierDriversPage";
import SupplierFinancePage from "./pages/SupplierFinancePage";
import SupplierHistoryPage from "./pages/SupplierHistoryPage";
import SupplierInvoicesPage from "./pages/SupplierInvoicesPage";
import SupplierLoginPage from "./pages/SupplierLoginPage";
import SupplierResetPasswordPage from "./pages/SupplierResetPasswordPage";
import SupplierVehiclesPage from "./pages/SupplierVehiclesPage";
import { LanguageSwitcher } from "./i18n.jsx";
import { clearStoredAuth, getStoredUser, logout } from "./services/authService";

const NAVIGATION_ITEMS = [
  { id: "available-jobs", label: "Açık İşler", icon: "⚡" },
  { id: "transfers", label: "Transferlerim", icon: "📋" },
  { id: "history", label: "Geçmiş", icon: "🗂️" },
  { id: "drivers", label: "Sürücüler", icon: "👤" },
  { id: "vehicles", label: "Araçlar", icon: "🚐" },
  { id: "finance", label: "Hakedişlerim", icon: "💶" },
  { id: "invoices", label: "Faturalar", icon: "📄" },
];

export default function App() {
  const [user, setUser] = useState(getStoredUser());
  const [currentPage, setCurrentPage] = useState("available-jobs");
  const [resetRequest, setResetRequest] = useState(() => readResetRequest());

  useEffect(() => {
    function handleUnauthenticated() {
      clearStoredAuth();
      setUser(null);
      setCurrentPage("available-jobs");
    }
    window.addEventListener("skyfleet-supplier:unauthenticated", handleUnauthenticated);
    return () => window.removeEventListener("skyfleet-supplier:unauthenticated", handleUnauthenticated);
  }, []);

  async function handleLogout() {
    await logout();
    setUser(null);
    setCurrentPage("available-jobs");
  }

  function returnToLogin() {
    const url = new URL(window.location.href);
    url.searchParams.delete("reset_token");
    url.searchParams.delete("email");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    setResetRequest(null);
  }

  if (!user && resetRequest) {
    return (
      <>
        <div style={{ position: "fixed", top: 16, right: 16, zIndex: 1000 }}>
          <LanguageSwitcher />
        </div>
        <SupplierResetPasswordPage
          email={resetRequest.email}
          token={resetRequest.token}
          onDone={returnToLogin}
        />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <div style={{ position: "fixed", top: 16, right: 16, zIndex: 1000 }}>
          <LanguageSwitcher />
        </div>
        <SupplierLoginPage
          onLogin={(loggedInUser) => {
            setUser(loggedInUser);
            setCurrentPage("available-jobs");
          }}
        />
      </>
    );
  }

  const company = user?.supplier_company;

  return (
    <div className="supplier-app-shell">
      <header className="supplier-header supplier-main-header">
        <div className="supplier-header-brand">
          <div className="supplier-brand-logo">SF</div>
          <div><strong>SKYFLEET<span> AI</span></strong><small>Supplier Network</small></div>
        </div>

        <nav className="supplier-header-navigation">
          {NAVIGATION_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={currentPage === item.id ? "active" : ""}
              onClick={() => setCurrentPage(item.id)}
            >
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>

        <div className="supplier-header-user">
          <LanguageSwitcher />
          <div><strong>{company?.company_name || user?.name}</strong><small>Tedarikçi</small></div>
          <button type="button" onClick={handleLogout}>Çıkış</button>
        </div>
      </header>

      {currentPage === "available-jobs" && (
        <SupplierAvailableJobsPage onOpenMyTransfers={() => setCurrentPage("transfers")} />
      )}
      {currentPage === "transfers" && <SupplierDashboardPage user={user} onLogout={handleLogout} />}
      {currentPage === "history" && <SupplierHistoryPage />}
      {currentPage === "drivers" && <SupplierDriversPage />}
      {currentPage === "vehicles" && <SupplierVehiclesPage />}
      {currentPage === "finance" && <SupplierFinancePage />}
      {currentPage === "invoices" && <SupplierInvoicesPage />}
    </div>
  );
}

function readResetRequest() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("reset_token");
  const email = params.get("email");
  return token && email ? { token, email } : null;
}

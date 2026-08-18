import { useEffect, useState } from "react";
import "./App.css";
import SupplierDashboardPage from "./pages/SupplierDashboardPage";
import SupplierDriversPage from "./pages/SupplierDriversPage";
import SupplierFinancePage from "./pages/SupplierFinancePage";
import SupplierInvoicesPage from "./pages/SupplierInvoicesPage";
import SupplierLoginPage from "./pages/SupplierLoginPage";
import SupplierVehiclesPage from "./pages/SupplierVehiclesPage";
import { clearStoredAuth, getStoredUser, logout } from "./services/authService";

const NAVIGATION_ITEMS = [
  { id: "transfers", label: "Transferler", icon: "📋" },
  { id: "drivers", label: "Sürücüler", icon: "👤" },
  { id: "vehicles", label: "Araçlar", icon: "🚐" },
  { id: "finance", label: "Hakedişlerim", icon: "💶" },
  { id: "invoices", label: "Faturalar", icon: "📄" },
];

export default function App() {
  const [user, setUser] = useState(getStoredUser());
  const [currentPage, setCurrentPage] = useState("transfers");

  useEffect(() => {
    function handleUnauthenticated() {
      clearStoredAuth();
      setUser(null);
      setCurrentPage("transfers");
    }
    window.addEventListener("skyfleet-supplier:unauthenticated", handleUnauthenticated);
    return () => window.removeEventListener("skyfleet-supplier:unauthenticated", handleUnauthenticated);
  }, []);

  async function handleLogout() {
    await logout();
    setUser(null);
    setCurrentPage("transfers");
  }

  if (!user) {
    return (
      <SupplierLoginPage
        onLogin={(loggedInUser) => {
          setUser(loggedInUser);
          setCurrentPage("transfers");
        }}
      />
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
          <div><strong>{company?.company_name || user?.name}</strong><small>Tedarikçi</small></div>
          <button type="button" onClick={handleLogout}>Çıkış</button>
        </div>
      </header>

      {currentPage === "transfers" && <SupplierDashboardPage user={user} onLogout={handleLogout} />}
      {currentPage === "drivers" && <SupplierDriversPage />}
      {currentPage === "vehicles" && <SupplierVehiclesPage />}
      {currentPage === "finance" && <SupplierFinancePage />}
      {currentPage === "invoices" && <SupplierInvoicesPage />}
    </div>
  );
}

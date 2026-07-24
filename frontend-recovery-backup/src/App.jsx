import { useState } from "react";
import "./App.css";

import DispatcherPage from "./pages/DispatcherPage";
import FleetPage from "./pages/FleetPage";
import LoginPage from "./pages/LoginPage";
import TransferDetailPage from "./pages/TransferDetailPage";

import {
  getStoredUser,
  logout,
} from "./services/authService";

function App() {
  const [user, setUser] = useState(getStoredUser());
  const [selectedTransfer, setSelectedTransfer] =
    useState(null);
  const [currentPage, setCurrentPage] =
    useState("dispatcher");

  function handleLogin(loggedInUser) {
    setUser(loggedInUser);
  }

  function handleLogout() {
    logout();
    setUser(null);
    setSelectedTransfer(null);
    setCurrentPage("dispatcher");
  }

  function handleSelectTransfer(transfer) {
    setSelectedTransfer(transfer);
  }

  function handleBackToDispatcher() {
    setSelectedTransfer(null);
    setCurrentPage("dispatcher");
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (selectedTransfer) {
    return (
      <TransferDetailPage
        transfer={selectedTransfer}
        onBack={handleBackToDispatcher}
      />
    );
  }

  if (currentPage === "fleet") {
    return (
      <FleetPage
        onBack={() =>
          setCurrentPage("dispatcher")
        }
      />
    );
  }

  return (
    <DispatcherPage
      onViewTransfer={handleSelectTransfer}
      onOpenFleet={() => setCurrentPage("fleet")}
      onLogout={handleLogout}
    />
  );
}

export default App;
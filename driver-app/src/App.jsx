import { useEffect, useState } from "react";

import DriverHomePage from "./pages/DriverHomePage";
import DriverLoginPage from "./pages/DriverLoginPage";
import DispatcherApp from "./dispatcher/DispatcherApp";

import {
  getStoredDriver,
  logoutDriver,
} from "./services/authService";

import "./styles/driver-app.css";

export default function App() {
  const [user, setUser] = useState(
    getStoredDriver(),
  );

  useEffect(() => {
    function handleUnauthenticated() {
      setUser(null);
    }

    window.addEventListener(
      "skyfleet-driver:unauthenticated",
      handleUnauthenticated,
    );

    return () => {
      window.removeEventListener(
        "skyfleet-driver:unauthenticated",
        handleUnauthenticated,
      );
    };
  }, []);  async function handleLogout() {
    await logoutDriver();
    setUser(null);
  }

  const routePath = window.location.hash ? window.location.hash.replace(/^#/, "") : window.location.pathname;
  const isDispatcherRoute = routePath.startsWith("/dispatcher") || window.location.pathname.startsWith("/dispatcher");

  if (isDispatcherRoute) {
    return <DispatcherApp />;
  }

  if (!user) {
    return (
      <DriverLoginPage
        onLogin={setUser}
      />
    );
  }

  return (
    <DriverHomePage
      user={user}
      onLogout={handleLogout}
    />
  );
}



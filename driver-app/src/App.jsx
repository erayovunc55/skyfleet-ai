import { useEffect, useState } from "react";

import DriverHomePage from "./pages/DriverHomePage";
import DriverLoginPage from "./pages/DriverLoginPage";

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
  }, []);

  async function handleLogout() {
    await logoutDriver();
    setUser(null);
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
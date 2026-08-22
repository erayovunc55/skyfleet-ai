import { useEffect, useState } from "react";

import DriverHomePage from "./pages/DriverHomePage";
import DriverLoginPage from "./pages/DriverLoginPage";
import DriverPasswordResetPage from "./pages/DriverPasswordResetPage";

import {
  getStoredDriver,
  logoutDriver,
} from "./services/authService";

import {
  LanguageProvider,
  LanguageSwitcher,
} from "./i18n";

import "./styles/driver-app.css";

function hasPasswordResetLink() {
  const params = new URLSearchParams(
    window.location.search,
  );

  return Boolean(
    params.get("reset_token") &&
      params.get("driver"),
  );
}

export default function App() {
  const [user, setUser] = useState(
    getStoredDriver(),
  );

  const [resetMode, setResetMode] =
    useState(hasPasswordResetLink());

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

  function handleResetCompleted() {
    window.history.replaceState(
      {},
      "",
      window.location.pathname,
    );

    setResetMode(false);
    setUser(null);
  }

  return (
    <LanguageProvider>
      <LanguageSwitcher />

      {resetMode ? (
        <DriverPasswordResetPage
          onCompleted={handleResetCompleted}
        />
      ) : !user ? (
        <DriverLoginPage
          onLogin={setUser}
        />
      ) : (
        <DriverHomePage
          user={user}
          onLogout={handleLogout}
        />
      )}
    </LanguageProvider>
  );
}

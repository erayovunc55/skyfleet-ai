import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import AppProvider from "./context/AppProvider.jsx";
import { LanguageProvider } from "./i18n.jsx";

import "./styles/core/variables.css";
import "./styles/core/base.css";

import "./styles/components/components.css";
import "./styles/components/forms.css";

import "./styles/layout/admin-layout.css";

import "./styles/modules/transfers.css";
import "./styles/modules/transfer-table-polish.css";
import "./styles/modules/transfer-column-filters.css";
import "./styles/modules/transfer-supplier-suggestions.css";
import "./styles/modules/transfer-commercial-summary.css";
import "./styles/modules/suppliers.css";
import "./styles/modules/supplier-detail.css";
import "./styles/modules/drivers.css";
import "./styles/fleet.css";

createRoot(
  document.getElementById("root"),
).render(
  <StrictMode>
    <LanguageProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </LanguageProvider>
  </StrictMode>,
);
import { useState } from "react";

import { LANGUAGES, useLanguage } from "../i18n";
import "../styles/settings.css";

const COPY = {
  en: {
    eyebrow: "PLATFORM CONTROL",
    title: "Settings",
    subtitle: "Manage your panel preferences and review access details.",
    preferences: "Workspace preferences",
    language: "Interface language",
    languageDetail: "Used across the control center.",
    alerts: "Operational alerts",
    alertsDetail: "Receive live alerts in the notification center.",
    on: "Enabled",
    off: "Disabled",
    account: "Account & access",
    signedInAs: "Signed in as",
    role: "Access role",
    scope: "Permission scope",
    scopeValue: "Dispatcher operations and administration",
    security: "Security",
    securityDetail: "Password and two-factor authentication are managed by the platform administrator.",
    managed: "Managed by administrator",
    system: "System status",
    api: "API connection",
    connected: "Connected",
    source: "Configuration source",
    local: "Local workspace",
    saved: "Preferences saved",
  },
  tr: {
    eyebrow: "PLATFORM KONTROLÜ",
    title: "Ayarlar",
    subtitle: "Panel tercihlerinizi yönetin ve erişim bilgilerinizi inceleyin.",
    preferences: "Çalışma alanı tercihleri",
    language: "Arayüz dili",
    languageDetail: "Kontrol merkezi genelinde kullanılır.",
    alerts: "Operasyon uyarıları",
    alertsDetail: "Bildirim merkezinde canlı uyarıları alın.",
    on: "Açık",
    off: "Kapalı",
    account: "Hesap ve erişim",
    signedInAs: "Oturum açan",
    role: "Erişim rolü",
    scope: "Yetki kapsamı",
    scopeValue: "Dispatcher operasyonları ve yönetim",
    security: "Güvenlik",
    securityDetail: "Şifre ve iki aşamalı doğrulama platform yöneticisi tarafından yönetilir.",
    managed: "Yönetici tarafından yönetilir",
    system: "Sistem durumu",
    api: "API bağlantısı",
    connected: "Bağlı",
    source: "Yapılandırma kaynağı",
    local: "Yerel çalışma alanı",
    saved: "Tercihler kaydedildi",
  },
};

export default function SettingsPage({ user }) {
  const { language, setLanguage } = useLanguage();
  const text = COPY[language] || COPY.en;
  const [alertsEnabled, setAlertsEnabled] = useState(() => localStorage.getItem("skyfleet_alerts_enabled") !== "false");
  const [saved, setSaved] = useState(false);

  function updateAlerts(enabled) {
    setAlertsEnabled(enabled);
    localStorage.setItem("skyfleet_alerts_enabled", String(enabled));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  function updateLanguage(nextLanguage) {
    setLanguage(nextLanguage);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <main className="settings-page">
      <header className="settings-header">
        <div><span className="settings-eyebrow">{text.eyebrow}</span><h1>{text.title}</h1><p>{text.subtitle}</p></div>
        {saved && <span className="settings-saved">{text.saved}</span>}
      </header>

      <div className="settings-grid">
        <section className="settings-panel">
          <div className="settings-panel-heading"><span>01</span><div><h2>{text.preferences}</h2><p>{text.subtitle}</p></div></div>
          <div className="settings-row"><div><strong>{text.language}</strong><small>{text.languageDetail}</small></div><select value={language} onChange={(event) => updateLanguage(event.target.value)} aria-label={text.language}>{LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></div>
          <div className="settings-row"><div><strong>{text.alerts}</strong><small>{text.alertsDetail}</small></div><button type="button" className={`settings-toggle ${alertsEnabled ? "enabled" : ""}`} aria-pressed={alertsEnabled} onClick={() => updateAlerts(!alertsEnabled)}><span />{alertsEnabled ? text.on : text.off}</button></div>
        </section>

        <section className="settings-panel">
          <div className="settings-panel-heading"><span>02</span><div><h2>{text.account}</h2><p>{text.securityDetail}</p></div></div>
          <InfoRow label={text.signedInAs} value={user?.email || user?.phone || "-"} />
          <InfoRow label={text.role} value={formatRole(user?.role)} />
          <InfoRow label={text.scope} value={text.scopeValue} />
        </section>

        <section className="settings-panel">
          <div className="settings-panel-heading"><span>03</span><div><h2>{text.security}</h2><p>{text.securityDetail}</p></div></div>
          <div className="settings-security"><span className="settings-status-dot" /><div><strong>{text.managed}</strong><small>{text.securityDetail}</small></div></div>
        </section>

        <section className="settings-panel">
          <div className="settings-panel-heading"><span>04</span><div><h2>{text.system}</h2><p>{text.source}</p></div></div>
          <InfoRow label={text.api} value={<span className="settings-connected"><i />{text.connected}</span>} />
          <InfoRow label={text.source} value={text.local} />
        </section>
      </div>
    </main>
  );
}

function InfoRow({ label, value }) { return <div className="settings-info-row"><span>{label}</span><strong>{value}</strong></div>; }
function formatRole(role) { return ({ dispatcher: "Dispatcher", admin: "Administrator", super_admin: "Super Administrator" })[role] || "Platform user"; }
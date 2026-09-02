import { useState } from "react";

import {
  login,
  requestPasswordReset,
} from "../services/authService";

export default function SupplierLoginPage({ onLogin }) {
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [forgotMode, setForgotMode] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (forgotMode) {
        const data = await requestPasswordReset(loginValue.trim());
        setMessage(data?.message || "Şifre sıfırlama bağlantısı gönderildi.");
        return;
      }

      const data = await login(loginValue.trim(), password);
      onLogin?.(data.user);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
        requestError?.message ||
        (forgotMode ? "Şifre sıfırlama bağlantısı gönderilemedi." : "Giriş yapılamadı."),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="supplier-login-page">
      <section className="supplier-login-card">
        <div className="supplier-login-brand">
          <div className="supplier-brand-logo">SF</div>
          <div>
            <strong>SKYFLEET<span> AI</span></strong>
            <small>Supplier Network</small>
          </div>
        </div>

        <div className="supplier-login-divider" />

        <span className="supplier-eyebrow">TEDARİKÇİ PORTALI</span>
        <h1>{forgotMode ? "Şifrenizi sıfırlayın" : "Tekrar hoş geldiniz"}</h1>
        <p>
          {forgotMode
            ? "Portal giriş e-postanızı yazın. Size 60 dakika geçerli bir şifre sıfırlama bağlantısı gönderelim."
            : "Transferlerinizi ve hakedişlerinizi güvenle yönetin."}
        </p>

        <form className="supplier-login-form" onSubmit={handleSubmit}>
          <label>
            <span>{forgotMode ? "Portal giriş e-postası" : "E-posta veya telefon"}</span>
            <input
              type={forgotMode ? "email" : "text"}
              value={loginValue}
              placeholder={forgotMode ? "ornek@firma.com" : "Tedarikçi hesabınız"}
              autoComplete="username"
              required
              onChange={(event) => setLoginValue(event.target.value)}
            />
          </label>

          {!forgotMode && (
            <label>
              <span>Şifre</span>
              <div className="supplier-password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="Şifreniz"
                  autoComplete="current-password"
                  required
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button type="button" onClick={() => setShowPassword((current) => !current)}>
                  {showPassword ? "Gizle" : "Göster"}
                </button>
              </div>
            </label>
          )}

          {error && <div className="supplier-message error">{error}</div>}
          {message && <div className="supplier-message">{message}</div>}

          <button className="supplier-primary-button" type="submit" disabled={loading}>
            {loading
              ? (forgotMode ? "Gönderiliyor..." : "Giriş yapılıyor...")
              : (forgotMode ? "Sıfırlama Bağlantısı Gönder" : "Giriş Yap")}
          </button>

          <button
            type="button"
            className="supplier-secondary-button"
            onClick={() => {
              setForgotMode((current) => !current);
              setError("");
              setMessage("");
              setPassword("");
            }}
          >
            {forgotMode ? "← Giriş ekranına dön" : "Şifremi Unuttum"}
          </button>
        </form>

        <div className="supplier-login-security">
          <span>●</span>
          Güvenli tedarikçi erişimi
        </div>
      </section>
    </main>
  );
}

import { useState } from "react";

import { loginDriver, requestDriverPasswordReset } from "../services/authService";

export default function DriverLoginPage({
  onLogin,
  onApply,
}) {
  const [login, setLogin] = useState("");
  const [password, setPassword] =
    useState("");
  const [loading, setLoading] =
    useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (forgotMode) {
        const result = await requestDriverPasswordReset(login);
        setMessage(result.message);
        return;
      }
      const user = await loginDriver({
        login,
        password,
      });

      onLogin(user);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Giriş yapılamadı.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="driver-login-page">
      <section className="driver-login-card">
        <img
          className="driver-login-logo"
          src={`${import.meta.env.BASE_URL}driver-icon-192.png`}
          alt="Skyfleet"
          width={88}
          height={88}
        />

        <p>SKYFLEET <span className="driver-brand-subtitle">DRIVER</span></p>
        <h1>{forgotMode ? "Şifremi Unuttum" : "Sürücü Girişi"}</h1>

        <span>
          Atanmış transferlerinizi yönetin ve
          canlı konum paylaşın.
        </span>

        <form onSubmit={handleSubmit}>
          <label>
            Telefon veya e-posta

            <input
              type="text"
              value={login}
              autoComplete="username"
              onChange={(event) =>
                setLogin(event.target.value)
              }
            />
          </label>

          {!forgotMode && <label>
            Şifre

            <div className="driver-password-field">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              autoComplete="current-password"
              onChange={(event) =>
                setPassword(event.target.value)
              }
            />
            <button type="button" aria-label={showPassword ? "Şifreyi Gizle" : "Şifreyi Göster"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? "Gizle" : "Göster"}
            </button>
            </div>
          </label>}

          {error && (
            <div className="driver-login-error">
              {error}
            </div>
          )}
          {message && <div className="driver-login-message" role="status">{message}</div>}

          <button
            type="submit"
            disabled={
              loading ||
              !login.trim() ||
              (!forgotMode && !password)
            }
          >
            {forgotMode ? (loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder") : loading
              ? "Giriş yapılıyor..."
              : "Giriş Yap"}
          </button>
          <button className="driver-forgot-button" type="button" disabled={loading} onClick={() => {
            setForgotMode((value) => !value); setError(""); setMessage(""); setPassword(""); setShowPassword(false);
          }}>{forgotMode ? "Giriş ekranına dön" : "Şifremi Unuttum"}</button>
        </form>
        <div className="driver-partner-actions">
          <button type="button" onClick={onApply}>
            Kendi aracımla tedarikçi olmak istiyorum
          </button>
          <a href="https://skytriptransfer.com/supplier/" target="_blank" rel="noreferrer">
            Tedarikçi girişi / Açık işler
          </a>
          <a href="https://skytriptransfer.com/privacy-policy/" target="_blank" rel="noreferrer">
            Gizlilik Politikası / Privacy Policy
          </a>
        </div>
      </section>
    </main>
  );
}
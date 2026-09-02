import { useState } from "react";
import { resetPassword } from "../services/authService";

export default function SupplierResetPasswordPage({ email, token, onDone }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await resetPassword({
        email,
        token,
        password,
        passwordConfirmation: confirmation,
      });
      setMessage(data?.message || "Şifreniz güncellendi.");
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
        requestError?.message ||
        "Şifre güncellenemedi.",
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
          <div><strong>SKYFLEET<span> AI</span></strong><small>Supplier Network</small></div>
        </div>
        <div className="supplier-login-divider" />
        <span className="supplier-eyebrow">ŞİFRE SIFIRLAMA</span>
        <h1>Yeni şifrenizi belirleyin</h1>
        <p>{email}</p>

        <form className="supplier-login-form" onSubmit={submit}>
          <label>
            <span>Yeni şifre</span>
            <input
              type="password"
              value={password}
              minLength={8}
              autoComplete="new-password"
              required
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <label>
            <span>Yeni şifre tekrar</span>
            <input
              type="password"
              value={confirmation}
              minLength={8}
              autoComplete="new-password"
              required
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </label>

          {error && <div className="supplier-message error">{error}</div>}
          {message && <div className="supplier-message">{message}</div>}

          {!message && (
            <button className="supplier-primary-button" type="submit" disabled={loading}>
              {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
            </button>
          )}

          <button type="button" className="supplier-secondary-button" onClick={onDone}>
            ← Giriş ekranına dön
          </button>
        </form>
      </section>
    </main>
  );
}

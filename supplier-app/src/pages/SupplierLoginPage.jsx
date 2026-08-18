import {
  useState,
} from "react";

import {
  login,
} from "../services/authService";

export default function SupplierLoginPage({
  onLogin,
}) {
  const [loginValue, setLoginValue] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const data = await login(
        loginValue.trim(),
        password,
      );

      onLogin?.(data.user);
    } catch (requestError) {
      setError(
        requestError?.response
          ?.data?.message ||
        requestError?.message ||
        "Giriş yapılamadı.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="supplier-login-page">
      <section className="supplier-login-card">
        <div className="supplier-login-brand">
          <div className="supplier-brand-logo">
            SF
          </div>

          <div>
            <strong>
              SKYFLEET
              <span> AI</span>
            </strong>

            <small>
              Supplier Network
            </small>
          </div>
        </div>

        <div className="supplier-login-divider" />

        <span className="supplier-eyebrow">
          TEDARİKÇİ PORTALI
        </span>

        <h1>
          Tekrar hoş geldiniz
        </h1>

        <p>
          Transferlerinizi ve
          hakedişlerinizi güvenle yönetin.
        </p>

        <form
          className="supplier-login-form"
          onSubmit={handleSubmit}
        >
          <label>
            <span>
              E-posta veya telefon
            </span>

            <input
              type="text"
              value={loginValue}
              placeholder="Tedarikçi hesabınız"
              autoComplete="username"
              required
              onChange={(event) =>
                setLoginValue(
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            <span>Şifre</span>

            <div className="supplier-password-field">
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                placeholder="Şifreniz"
                autoComplete="current-password"
                required
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) =>
                      !current,
                  )
                }
              >
                {showPassword
                  ? "Gizle"
                  : "Göster"}
              </button>
            </div>
          </label>

          {error && (
            <div className="supplier-message error">
              {error}
            </div>
          )}

          <button
            className="supplier-primary-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Giriş yapılıyor..."
              : "Giriş Yap"}
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
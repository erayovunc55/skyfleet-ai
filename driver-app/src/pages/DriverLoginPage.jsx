import { useState } from "react";

import { loginDriver } from "../services/authService";

export default function DriverLoginPage({
  onLogin,
}) {
  const [login, setLogin] = useState("");
  const [password, setPassword] =
    useState("");
  const [loading, setLoading] =
    useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
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
        <div className="driver-login-logo">
          SF
        </div>

        <p>SKYFLEET AI</p>
        <h1>Sürücü Girişi</h1>

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

          <label>
            Şifre

            <input
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(event) =>
                setPassword(event.target.value)
              }
            />
          </label>

          {error && (
            <div className="driver-login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              !login.trim() ||
              !password
            }
          >
            {loading
              ? "Giriş yapılıyor..."
              : "Giriş Yap"}
          </button>
        </form>
      </section>
    </main>
  );
}
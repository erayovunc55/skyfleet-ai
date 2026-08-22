import { useMemo, useState } from "react";

import { resetDriverPassword } from "../services/authService";

export default function DriverPasswordResetPage({
  onCompleted,
}) {
  const params = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  );

  const driverId = params.get("driver") || "";
  const token = params.get("reset_token") || "";

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const linkIsValid = Boolean(driverId && token);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!linkIsValid) {
      setError("Şifre sıfırlama bağlantısı eksik veya geçersiz.");
      return;
    }

    if (password.length < 8) {
      setError("Yeni şifre en az 8 karakter olmalıdır.");
      return;
    }

    if (password !== confirmation) {
      setError("Şifreler birbiriyle eşleşmiyor.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await resetDriverPassword({
        driverId,
        token,
        password,
        passwordConfirmation: confirmation,
      });

      setMessage(
        response?.message ||
          "Şifreniz başarıyla güncellendi.",
      );

      window.history.replaceState(
        {},
        "",
        window.location.pathname,
      );
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
    <main className="driver-login-page">
      <section className="driver-login-card">
        <div className="driver-login-logo">SF</div>

        <p>SKYFLEET AI</p>
        <h1>Yeni Şifre Belirle</h1>

        <span>
          Sürücü hesabınız için yeni bir şifre oluşturun.
          Bağlantı tek kullanımlıktır.
        </span>

        {!linkIsValid ? (
          <div className="driver-login-error">
            Şifre sıfırlama bağlantısı eksik veya geçersiz.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>
              Yeni şifre
              <input
                type="password"
                minLength="8"
                autoComplete="new-password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
              />
            </label>

            <label>
              Yeni şifre tekrar
              <input
                type="password"
                minLength="8"
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) =>
                  setConfirmation(event.target.value)
                }
              />
            </label>

            {error && (
              <div className="driver-login-error">
                {error}
              </div>
            )}

            {message && (
              <div className="driver-login-success">
                {message}
              </div>
            )}

            {!message ? (
              <button
                type="submit"
                disabled={loading || !password || !confirmation}
              >
                {loading
                  ? "Şifre güncelleniyor..."
                  : "Şifreyi Güncelle"}
              </button>
            ) : (
              <button
                type="button"
                onClick={onCompleted}
              >
                Sürücü Girişine Dön
              </button>
            )}
          </form>
        )}
      </section>
    </main>
  );
}

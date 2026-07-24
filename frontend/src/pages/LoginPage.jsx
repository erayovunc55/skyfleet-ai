import { useState } from "react";
import { login } from "../services/authService";

export default function LoginPage({ onLogin }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const data = await login(phone, password);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">

        <div className="brand">
          <div className="brand-icon">✈</div>

          <div>
            <h1>SKYFLEET <span>AI</span></h1>
            <p>Every Transfer, Under Control.</p>
          </div>
        </div>

        <div className="welcome">
          <span className="driver-badge">SÜRÜCÜ UYGULAMASI</span>

          <h2>Tekrar hoş geldiniz</h2>

          <p>Devam etmek için hesabınıza giriş yapın.</p>
        </div>

        <form onSubmit={handleSubmit}>

          <label>Telefon numarası</label>

          <div className="input-group">
            <span className="input-icon">+90</span>

            <input
              value={phone}
              onChange={(e)=>setPhone(e.target.value)}
              placeholder="5XX XXX XX XX"
            />
          </div>

          <label>Şifre</label>

          <div className="input-group">

            <input
              type={showPassword ? "text":"password"}
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              placeholder="Şifreniz"
            />

            <button
              type="button"
              className="password-toggle"
              onClick={()=>setShowPassword(!showPassword)}
            >
              {showPassword ? "Gizle":"Göster"}
            </button>

          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            className="login-button"
            disabled={loading}
          >
            {loading ? "Giriş yapılıyor..." : "GİRİŞ YAP"}
          </button>

        </form>

      </section>
    </main>
  );
}
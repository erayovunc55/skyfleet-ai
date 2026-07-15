import { useState } from "react";
import "./App.css";

function App() {
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    alert("Giriş sistemi daha sonra Laravel API'ye bağlanacak.");
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand">
          <div className="brand-icon">✈</div>

          <div>
            <h1>
              SKYFLEET <span>AI</span>
            </h1>
            <p>Every Transfer, Under Control.</p>
          </div>
        </div>

        <div className="welcome">
          <span className="driver-badge">SÜRÜCÜ UYGULAMASI</span>
          <h2>Tekrar hoş geldiniz</h2>
          <p>Devam etmek için hesabınıza giriş yapın.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="phone">Telefon numarası</label>

          <div className="input-group">
            <span className="input-icon">+90</span>
            <input
              id="phone"
              type="tel"
              placeholder="5XX XXX XX XX"
              autoComplete="tel"
              required
            />
          </div>

          <label htmlFor="password">Şifre</label>

          <div className="input-group">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Şifrenizi girin"
              autoComplete="current-password"
              required
            />

            <button
              className="password-toggle"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Gizle" : "Göster"}
            </button>
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Beni hatırla</span>
            </label>

            <button className="forgot-password" type="button">
              Şifremi unuttum
            </button>
          </div>

          <button className="login-button" type="submit">
            GİRİŞ YAP
          </button>
        </form>
      </section>
    </main>
  );
}

export default App;
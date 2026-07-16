import { useState } from "react";
import "./App.css";

const transfers = [
  {
    id: 23935,
    time: "07:30",
    route: "IST → Taksim",
    passenger: "John Smith",
    flight: "TK1987",
    status: "Yaklaşıyor",
  },
  {
    id: 23937,
    time: "09:15",
    route: "SAW → Kadıköy",
    passenger: "Maria Garcia",
    flight: "PC266",
    status: "Bekliyor",
  },
  {
    id: 23936,
    time: "11:45",
    route: "IST → Beşiktaş",
    passenger: "Ahmed Hassan",
    flight: "TK1991",
    status: "Bekliyor",
  },
];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setIsLoggedIn(true);
  }

  if (isLoggedIn) {
    return (
      <main className="dashboard-page">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">SKYFLEET AI</p>
            <h1>Merhaba Eray 👋</h1>
            <span>Bugünkü operasyon özetiniz</span>
          </div>

          <button
            className="profile-button"
            type="button"
            onClick={() => setIsLoggedIn(false)}
          >
            EÖ
          </button>
        </header>

        <section className="stats-grid">
          <article className="stat-card stat-card-primary">
            <span>Bugünkü Kazanç</span>
            <strong>€245</strong>
            <small>4 tamamlanan transfer</small>
          </article>

          <article className="stat-card">
            <span>Bekleyen</span>
            <strong>2</strong>
            <small>Atanmış transfer</small>
          </article>

          <article className="stat-card">
            <span>Devam Eden</span>
            <strong>1</strong>
            <small>Aktif yolculuk</small>
          </article>
        </section>

        <section className="transfer-section">
          <div className="section-heading">
            <div>
              <p>BUGÜN</p>
              <h2>Transferleriniz</h2>
            </div>

            <button type="button">Tümünü Gör</button>
          </div>

          <div className="transfer-list">
            {transfers.map((transfer) => (
              <article className="transfer-card" key={transfer.id}>
                <div className="transfer-time">
                  <strong>{transfer.time}</strong>
                  <span>#{transfer.id}</span>
                </div>

                <div className="transfer-info">
                  <div className="transfer-route">
                    <h3>{transfer.route}</h3>
                    <span className={`status-badge ${transfer.status.toLowerCase()}`}>
                      {transfer.status}
                    </span>
                  </div>

                  <p>{transfer.passenger}</p>
                  <small>Uçuş: {transfer.flight}</small>
                </div>

                <button className="transfer-arrow" type="button">
                  →
                </button>
              </article>
            ))}
          </div>
        </section>

        <nav className="bottom-navigation">
          <button className="active" type="button">
            <span>⌂</span>
            Ana Sayfa
          </button>

          <button type="button">
            <span>▣</span>
            Transferler
          </button>

          <button type="button">
            <span>⌖</span>
            Harita
          </button>

          <button type="button">
            <span>●</span>
            Bildirimler
          </button>

          <button type="button">
            <span>◉</span>
            Profil
          </button>
        </nav>
      </main>
    );
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
              required
            />
          </div>

          <label htmlFor="password">Şifre</label>

          <div className="input-group">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Şifrenizi girin"
              required
            />

            <button
              className="password-toggle"
              type="button"
              onClick={() => setShowPassword((current) => !current)}
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
import { useEffect, useState } from "react";
import { getTransfers } from "../services/transferService";

export default function DashboardPage({
  user,
  onSelectTransfer,
  onLogout,
}) {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTransfers() {
      try {
        const data = await getTransfers();
        setTransfers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Transferler yüklenemedi.");
      } finally {
        setLoading(false);
      }
    }

    loadTransfers();
  }, []);

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div className="dispatcher-header-actions">
  <span>
    Son güncelleme:{" "}
    {new Date().toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    })}
  </span>

  <button
    type="button"
    onClick={onOpenFleet}
  >
    Filo Yönetimi
  </button>
</div>

        <button
          className="profile-button"
          type="button"
          onClick={onLogout}
          title="Çıkış yap"
        >
          {getInitials(user?.name)}
        </button>
      </header>

      <section className="stats-grid">
        <article className="stat-card stat-card-primary">
          <span>Bugünkü Kazanç</span>
          <strong>
            €{calculateTotalEarnings(transfers)}
          </strong>
          <small>
            {countByStatus(transfers, "completed")} tamamlanan transfer
          </small>
        </article>

        <article className="stat-card">
          <span>Bekleyen</span>
          <strong>
            {countByStatus(transfers, "pending")}
          </strong>
          <small>Atanmış transfer</small>
        </article>

        <article className="stat-card">
          <span>Devam Eden</span>
          <strong>
            {countActiveTransfers(transfers)}
          </strong>
          <small>Aktif yolculuk</small>
        </article>
      </section>

      <section className="transfer-section">
        <div className="section-heading">
          <div>
            <p>TRANSFERLER</p>
            <h2>Atanmış işleriniz</h2>
          </div>

          <button type="button">
            Tümünü Gör
          </button>
        </div>

        {loading && (
          <p className="dashboard-message">
            Transferler yükleniyor...
          </p>
        )}

        {error && (
          <p className="dashboard-error">
            {error}
          </p>
        )}

        {!loading && !error && transfers.length === 0 && (
          <p className="dashboard-message">
            Atanmış transfer bulunamadı.
          </p>
        )}

        {!loading && !error && transfers.length > 0 && (
          <div className="transfer-list">
            {transfers.map((transfer) => (
              <article
                className="transfer-card"
                key={transfer.id}
              >
                <div className="transfer-time">
                  <strong>
                    {formatTime(transfer.pickup_time)}
                  </strong>

                  <span>
                    {transfer.booking_reference}
                  </span>
                </div>

                <div className="transfer-info">
                  <div className="transfer-route">
                    <h3>
                      {transfer.pickup} → {transfer.dropoff}
                    </h3>

                    <span
                      className={`status-badge ${transfer.status}`}
                    >
                      {getStatusLabel(transfer.status)}
                    </span>
                  </div>

                  <p>{transfer.passenger_name}</p>

                  <small>
                    Uçuş: {transfer.flight_number || "Belirtilmedi"}
                  </small>
                </div>

                <button
                  className="transfer-arrow"
                  type="button"
                  onClick={() => onSelectTransfer(transfer)}
                >
                  →
                </button>
              </article>
            ))}
          </div>
        )}
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

function getInitials(name) {
  if (!name) {
    return "SF";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function formatTime(dateTime) {
  if (!dateTime) {
    return "--:--";
  }

  return new Date(dateTime).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusLabel(status) {
  const labels = {
    pending: "Bekliyor",
    accepted: "Kabul Edildi",
    on_the_way: "Yola Çıkıldı",
    arrived: "Alış Noktasında",
    passenger_called: "Yolcu Arandı",
    passenger_on_board: "Yolcu Geldi",
    trip_started: "Yolculuk Başladı",
    completed: "Tamamlandı",
    no_show: "No Show",
  };

  return labels[status] || status;
}

function countByStatus(transfers, status) {
  return transfers.filter(
    (transfer) => transfer.status === status,
  ).length;
}

function countActiveTransfers(transfers) {
  const activeStatuses = [
    "accepted",
    "on_the_way",
    "arrived",
    "passenger_called",
    "passenger_on_board",
    "trip_started",
  ];

  return transfers.filter(
    (transfer) => activeStatuses.includes(transfer.status),
  ).length;
}

function calculateTotalEarnings(transfers) {
  return transfers
    .filter((transfer) => transfer.status === "completed")
    .reduce(
      (total, transfer) =>
        total + Number(transfer.price || 0),
      0,
    )
    .toFixed(2);
}
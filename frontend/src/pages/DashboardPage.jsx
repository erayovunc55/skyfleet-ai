import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { PAGES } from "../constants/pages";
import { getAdminDashboard } from "../services/dashboardService";

const STATUS_LABELS = {
  pending: "Bekliyor",
  accepted: "Kabul Edildi",
  assigned: "Atandı",
  on_the_way: "Yola Çıktı",
  arrived: "Alış Noktasında",
  passenger_called: "Yolcu Arandı",
  passenger_on_board: "Yolcu Araçta",
  trip_started: "Yolculuk Başladı",
  completed: "Tamamlandı",
  cancelled: "İptal",
  no_show: "No Show",
};

export default function DashboardPage({
  onNavigate,
}) {
  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadDashboard = useCallback(
    async ({
      silent = false,
    } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const data =
          await getAdminDashboard();

        setDashboard(data);
      } catch (requestError) {
        setError(
          requestError?.response
            ?.data?.message ||
          requestError?.message ||
          "Dashboard bilgileri yüklenemedi.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadDashboard();

    const timer = window.setInterval(
      () => {
        loadDashboard({
          silent: true,
        });
      },
      60000,
    );

    return () => {
      window.clearInterval(timer);
    };
  }, [loadDashboard]);

  const weeklyMaximum = useMemo(
    () =>
      Math.max(
        1,
        ...(
          dashboard
            ?.weekly_activity || []
        ).map(
          (item) =>
            Number(item.total) || 0,
        ),
      ),
    [
      dashboard?.weekly_activity,
    ],
  );

  if (
    loading &&
    !dashboard
  ) {
    return (
      <main className="executive-dashboard">
        <DashboardState>
          Kontrol merkezi yükleniyor...
        </DashboardState>
      </main>
    );
  }

  if (
    error &&
    !dashboard
  ) {
    return (
      <main className="executive-dashboard">
        <DashboardState error>
          <strong>
            Dashboard yüklenemedi
          </strong>

          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              loadDashboard()
            }
          >
            Tekrar Dene
          </button>
        </DashboardState>
      </main>
    );
  }

  const overview =
    dashboard?.overview || {};

  const network =
    dashboard?.network || {};

  const finance =
    dashboard?.finance || {};

  const alerts =
    dashboard?.alerts || [];

  const upcomingTransfers =
    dashboard
      ?.upcoming_transfers || [];

  const weeklyActivity =
    dashboard
      ?.weekly_activity || [];

  return (
    <main className="executive-dashboard">
      <header className="executive-dashboard-header">
        <div>
          <span className="executive-eyebrow">
            SKYFLEET INTELLIGENCE
          </span>

          <h1>
            Yönetici Kontrol Merkezi
          </h1>

          <p>
            Operasyon, finans ve tedarikçi
            ağınızı tek ekrandan izleyin.
          </p>
        </div>

        <div className="executive-header-actions">
          <div className="executive-live-state">
            <span />

            <div>
              <strong>
                Sistem Canlı
              </strong>

              <small>
                {formatGeneratedTime(
                  dashboard
                    ?.generated_at,
                )}
              </small>
            </div>
          </div>

          <button
            type="button"
            className="executive-refresh-button"
            disabled={refreshing}
            onClick={() =>
              loadDashboard({
                silent: true,
              })
            }
          >
            {refreshing
              ? "Yenileniyor..."
              : "Verileri Yenile"}
          </button>
        </div>
      </header>

      {error && (
        <div className="executive-inline-error">
          {error}
        </div>
      )}

      <section className="executive-kpi-grid">
        <KpiCard
          tone="blue"
          label="Bugünkü Transfer"
          value={
            overview.today_total || 0
          }
          detail={`${overview.unassigned || 0} sürücüsüz operasyon`}
        />

        <KpiCard
          tone="amber"
          label="Bekleyen"
          value={
            overview.pending || 0
          }
          detail="Atama veya operasyon bekliyor"
        />

        <KpiCard
          tone="cyan"
          label="Aktif Operasyon"
          value={
            overview.active || 0
          }
          detail="Şu anda sahada"
        />

        <KpiCard
          tone="green"
          label="Tamamlanan"
          value={
            overview.completed || 0
          }
          detail={`%${overview.completion_rate || 0} tamamlama oranı`}
        />

        <KpiCard
          tone="red"
          label="İptal"
          value={
            overview.cancelled || 0
          }
          detail="Bugünkü iptal edilen işler"
        />
      </section>

      <section className="executive-content-grid">
        <article className="executive-panel executive-finance-panel">
          <PanelHeader
            eyebrow="FİNANSAL PERFORMANS"
            title="Bugünkü Ticari Özet"
            description="Brüt satış, tedarikçi hakedişi ve platform marjı."
          />

          <div className="executive-finance-grid">
            <FinanceMetric
              label="Brüt Satış"
              values={
                finance.gross_revenue
              }
              tone="primary"
            />

            <FinanceMetric
              label="Tedarikçi Hakedişi"
              values={
                finance
                  .supplier_payable
              }
              tone="warning"
            />

            <FinanceMetric
              label="Skyfleet Marjı"
              values={
                finance
                  .platform_margin
              }
              tone="success"
            />
          </div>
        </article>

        <article className="executive-panel executive-network-panel">
          <PanelHeader
            eyebrow="GLOBAL NETWORK"
            title="Operasyon Ağı"
            description="Aktif kapasite ve tedarikçi büyüklüğü."
          />

          <div className="executive-network-grid">
            <NetworkMetric
              icon="◉"
              label="Aktif Sürücü"
              value={
                network
                  .active_drivers || 0
              }
            />

            <NetworkMetric
              icon="▣"
              label="Aktif Araç"
              value={
                network
                  .active_vehicles || 0
              }
            />

            <NetworkMetric
              icon="◆"
              label="Onaylı Tedarikçi"
              value={
                network
                  .approved_suppliers ||
                0
              }
            />
          </div>

          <button
            type="button"
            className="executive-panel-link"
            onClick={() =>
              onNavigate?.(
                PAGES.SUPPLIERS,
              )
            }
          >
            Tedarikçi ağını yönet →
          </button>
        </article>

        <article className="executive-panel executive-alert-panel">
          <PanelHeader
            eyebrow="AI OPERATIONS WATCH"
            title="Operasyon Uyarıları"
            description="Müdahale gerektiren durumların canlı özeti."
          />

          <div className="executive-alert-list">
            {alerts.map((alert) => (
              <div
                key={alert.key}
                className={`executive-alert-item ${alert.level}`}
              >
                <span className="executive-alert-dot" />

                <div>
                  <strong>
                    {alert.title}
                  </strong>

                  <small>
                    {getAlertDescription(
                      alert.key,
                    )}
                  </small>
                </div>

                <b>{alert.value}</b>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="executive-panel-link"
            onClick={() =>
              onNavigate?.(
                PAGES.LIVE_OPERATIONS,
              )
            }
          >
            Canlı operasyonları aç →
          </button>
        </article>

        <article className="executive-panel executive-chart-panel">
          <PanelHeader
            eyebrow="7 GÜNLÜK TREND"
            title="Transfer Aktivitesi"
            description="Toplam ve tamamlanan transfer performansı."
          />

          <div className="executive-chart-legend">
            <span>
              <i className="total" />
              Toplam
            </span>

            <span>
              <i className="completed" />
              Tamamlanan
            </span>
          </div>

          <div className="executive-bar-chart">
            {weeklyActivity.map(
              (item) => (
                <div
                  className="executive-chart-column"
                  key={item.date}
                >
                  <div className="executive-chart-values">
                    <div
                      className="executive-chart-bar total"
                      style={{
                        height:
                          getBarHeight(
                            item.total,
                            weeklyMaximum,
                          ),
                      }}
                      title={`${item.total} toplam`}
                    />

                    <div
                      className="executive-chart-bar completed"
                      style={{
                        height:
                          getBarHeight(
                            item.completed,
                            weeklyMaximum,
                          ),
                      }}
                      title={`${item.completed} tamamlanan`}
                    />
                  </div>

                  <strong>
                    {item.total}
                  </strong>

                  <span>
                    {item.label}
                  </span>
                </div>
              ),
            )}
          </div>
        </article>
      </section>

      <section className="executive-panel executive-upcoming-panel">
        <div className="executive-upcoming-header">
          <PanelHeader
            eyebrow="YAKLAŞAN OPERASYONLAR"
            title="Sonraki Transferler"
            description={`${upcomingTransfers.length} yaklaşan rezervasyon gösteriliyor.`}
          />

          <button
            type="button"
            className="executive-panel-link"
            onClick={() =>
              onNavigate?.(
                PAGES.TRANSFERS,
              )
            }
          >
            Tüm transferler →
          </button>
        </div>

        {upcomingTransfers.length ===
        0 ? (
          <div className="executive-empty-state">
            Yaklaşan transfer bulunmuyor.
          </div>
        ) : (
          <div className="executive-table-wrap">
            <table className="executive-transfer-table">
              <thead>
                <tr>
                  <th>Rezervasyon</th>
                  <th>Tarih ve Saat</th>
                  <th>Yolcu</th>
                  <th>Güzergâh</th>
                  <th>Tedarikçi</th>
                  <th>Sürücü / Araç</th>
                  <th>Durum</th>
                </tr>
              </thead>

              <tbody>
                {upcomingTransfers.map(
                  (transfer) => (
                    <tr key={transfer.id}>
                      <td>
                        <strong className="executive-reference">
                          {
                            transfer
                              .booking_reference
                          }
                        </strong>
                      </td>

                      <td>
                        {formatDateTime(
                          transfer
                            .pickup_time,
                        )}
                      </td>

                      <td>
                        {transfer
                          .passenger_name ||
                          "Belirtilmedi"}
                      </td>

                      <td>
                        <div className="executive-route">
                          <span>
                            {shortenText(
                              transfer.pickup,
                            )}
                          </span>

                          <b>→</b>

                          <span>
                            {shortenText(
                              transfer.dropoff,
                            )}
                          </span>
                        </div>
                      </td>

                      <td>
                        {transfer
                          .supplier_name ||
                          "Atanmadı"}
                      </td>

                      <td>
                        <strong>
                          {transfer
                            .driver_name ||
                            "Atanmadı"}
                        </strong>

                        <small>
                          {transfer
                            .vehicle_plate ||
                            "Araç yok"}
                        </small>
                      </td>

                      <td>
                        <span
                          className={`executive-status ${transfer.status}`}
                        >
                          {getStatusLabel(
                            transfer.status,
                          )}
                        </span>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function KpiCard({
  tone,
  label,
  value,
  detail,
}) {
  return (
    <article
      className={`executive-kpi-card ${tone}`}
    >
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function PanelHeader({
  eyebrow,
  title,
  description,
}) {
  return (
    <header className="executive-panel-header">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </header>
  );
}

function FinanceMetric({
  label,
  values = [],
  tone,
}) {
  const normalizedValues =
    Array.isArray(values)
      ? values
      : [];

  return (
    <div
      className={`executive-finance-metric ${tone}`}
    >
      <span>{label}</span>

      {normalizedValues.length > 0 ? (
        normalizedValues.map(
          (item) => (
            <strong
              key={item.currency}
            >
              {formatMoney(
                item.amount,
                item.currency,
              )}
            </strong>
          ),
        )
      ) : (
        <strong>€0,00</strong>
      )}
    </div>
  );
}

function NetworkMetric({
  icon,
  label,
  value,
}) {
  return (
    <div className="executive-network-metric">
      <span>{icon}</span>

      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </div>
  );
}

function DashboardState({
  children,
  error = false,
}) {
  return (
    <section
      className={
        error
          ? "executive-dashboard-state error"
          : "executive-dashboard-state"
      }
    >
      {children}
    </section>
  );
}

function getAlertDescription(key) {
  const descriptions = {
    unassigned_upcoming:
      "Önümüzdeki 6 saat içinde sürücüsü olmayan işler.",

    overdue_pending:
      "Alış zamanı geçtiği halde açık kalan rezervasyonlar.",

    gps_attention:
      "Son 10 dakikada güncel konum göndermeyen operasyonlar.",
  };

  return descriptions[key] || "";
}

function getStatusLabel(status) {
  return (
    STATUS_LABELS[status] ||
    status ||
    "Bilinmiyor"
  );
}

function formatGeneratedTime(value) {
  if (!value) {
    return "Güncelleme bekleniyor";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Güncelleme bekleniyor";
  }

  return `Son güncelleme ${date.toLocaleTimeString(
    "tr-TR",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  )}`;
}

function formatDateTime(value) {
  if (!value) {
    return "Tarih yok";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Tarih yok";
  }

  return date.toLocaleString(
    "tr-TR",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function formatMoney(
  amount,
  currency = "EUR",
) {
  try {
    return new Intl.NumberFormat(
      "tr-TR",
      {
        style: "currency",
        currency:
          currency || "EUR",
      },
    ).format(
      Number(amount) || 0,
    );
  } catch {
    return `${Number(amount || 0).toFixed(2)} ${currency}`;
  }
}

function getBarHeight(
  value,
  maximum,
) {
  const numericValue =
    Number(value) || 0;

  if (numericValue <= 0) {
    return "4px";
  }

  return `${Math.max(
    12,
    Math.round(
      (
        numericValue /
        maximum
      ) * 150,
    ),
  )}px`;
}

function shortenText(value) {
  const normalized =
    String(value || "").trim();

  if (!normalized) {
    return "Adres belirtilmedi";
  }

  if (normalized.length <= 42) {
    return normalized;
  }

  return `${normalized.slice(
    0,
    42,
  )}...`;
}
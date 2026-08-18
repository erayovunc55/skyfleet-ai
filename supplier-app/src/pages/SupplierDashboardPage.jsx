import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import SupplierTransferAssignment from "../components/SupplierTransferAssignment";

import {
  getSupplierProfile,
  getSupplierTransfer,
  getSupplierTransfers,
} from "../services/supplierService";

const STATUS_LABELS = {
  pending: "Bekliyor",
  accepted: "Kabul Edildi",
  on_the_way: "Yola Çıktı",
  arrived: "Alış Noktasında",
  passenger_called: "Yolcu Arandı",
  passenger_on_board: "Yolcu Araçta",
  trip_started: "Transfer Başladı",
  completed: "Tamamlandı",
  no_show: "No Show",
  cancelled: "İptal Edildi",
};

export default function SupplierDashboardPage({
  user,
  onLogout,
}) {
  const [profile, setProfile] =
    useState(null);

  const [transfers, setTransfers] =
    useState([]);

  const [
    selectedTransfer,
    setSelectedTransfer,
  ] = useState(null);

  const [filters, setFilters] =
    useState({
      search: "",
      status: "",
      dateFrom: "",
      dateTo: "",
    });

  const [loading, setLoading] =
    useState(true);

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const loadData = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const [
          profileData,
          transferData,
        ] = await Promise.all([
          getSupplierProfile(),

          getSupplierTransfers(
            filters,
          ),
        ]);

        const items = Array.isArray(
          transferData?.data,
        )
          ? transferData.data
          : [];

        setProfile(
          profileData,
        );

        setTransfers(
          items,
        );

        setSelectedTransfer(
          (current) => {
            if (!current) {
              return null;
            }

            return (
              items.find(
                (item) =>
                  Number(item.id) ===
                  Number(current.id),
              ) || null
            );
          },
        );
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "Tedarikçi bilgileri yüklenemedi.",
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = useMemo(
    () => ({
      total:
        transfers.length,

      waiting:
        transfers.filter(
          (transfer) =>
            transfer.status ===
            "pending",
        ).length,

      active:
        transfers.filter(
          (transfer) =>
            [
              "accepted",
              "on_the_way",
              "arrived",
              "passenger_called",
              "passenger_on_board",
              "trip_started",
            ].includes(
              transfer.status,
            ),
        ).length,

      completed:
        transfers.filter(
          (transfer) =>
            transfer.status ===
            "completed",
        ).length,

      totalAmount:
        transfers.reduce(
          (total, transfer) =>
            total +
            Number(
              transfer
                .supplier_amount ||
                0,
            ),
          0,
        ),
    }),
    [transfers],
  );

  async function selectTransfer(
    transfer,
  ) {
    setSelectedTransfer(
      transfer,
    );

    setDetailLoading(true);
    setError("");

    try {
      const detail =
        await getSupplierTransfer(
          transfer.id,
        );

      setSelectedTransfer(
        detail,
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Transfer detayı yüklenemedi.",
        ),
      );
    } finally {
      setDetailLoading(false);
    }
  }

  function handleTransferAssigned(
    updatedTransfer,
  ) {
    if (!updatedTransfer) {
      return;
    }

    setSelectedTransfer(
      updatedTransfer,
    );

    setTransfers(
      (currentTransfers) =>
        currentTransfers.map(
          (transfer) =>
            Number(transfer.id) ===
            Number(
              updatedTransfer.id,
            )
              ? {
                  ...transfer,
                  ...updatedTransfer,
                }
              : transfer,
        ),
    );
  }

  function updateFilter(
    name,
    value,
  ) {
    setFilters(
      (current) => ({
        ...current,
        [name]: value,
      }),
    );
  }

  function clearFilters() {
    setFilters({
      search: "",
      status: "",
      dateFrom: "",
      dateTo: "",
    });
  }

  const company =
    profile?.supplier ||
    user?.supplier_company;

  return (
    <div className="supplier-app-shell">
      <header className="supplier-header">
        <div className="supplier-header-brand">
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

        <div className="supplier-header-user">
          <div>
            <strong>
              {company
                ?.company_name ||
                user?.name}
            </strong>

            <small>
              Tedarikçi
            </small>
          </div>

          <button
            type="button"
            onClick={
              onLogout
            }
          >
            Çıkış
          </button>
        </div>
      </header>

      <main className="supplier-dashboard">
        <section className="supplier-page-heading">
          <div>
            <span className="supplier-eyebrow">
              OPERASYON
            </span>

            <h1>
              Tedarikçi Paneli
            </h1>

            <p>
              Atanan transferlerinizi,
              görevli sürücülerinizi ve net
              hakedişlerinizi yönetin.
            </p>
          </div>

          <button
            className="supplier-secondary-button"
            type="button"
            disabled={loading}
            onClick={loadData}
          >
            Yenile
          </button>
        </section>

        {error && (
          <div className="supplier-message error">
            {error}
          </div>
        )}

        <section className="supplier-summary-grid">
          <SummaryCard
            label="Toplam Transfer"
            value={summary.total}
          />

          <SummaryCard
            label="Bekleyen"
            value={summary.waiting}
          />

          <SummaryCard
            label="Aktif Operasyon"
            value={summary.active}
          />

          <SummaryCard
            label="Tamamlanan"
            value={summary.completed}
          />

          <SummaryCard
            label="Net Hakediş"
            value={formatMoney(
              summary.totalAmount,
              transfers[0]
                ?.currency ||
                company
                  ?.default_currency ||
                "EUR",
            )}
            accent
          />
        </section>

        <section className="supplier-filter-card">
          <label>
            <span>
              Transfer ara
            </span>

            <input
              type="search"
              value={
                filters.search
              }
              placeholder="SF numarası, yolcu, telefon veya uçuş..."
              onChange={(event) =>
                updateFilter(
                  "search",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            <span>Durum</span>

            <select
              value={
                filters.status
              }
              onChange={(event) =>
                updateFilter(
                  "status",
                  event.target.value,
                )
              }
            >
              <option value="">
                Tüm durumlar
              </option>

              {Object.entries(
                STATUS_LABELS,
              ).map(
                ([
                  value,
                  label,
                ]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            <span>Başlangıç</span>

            <input
              type="date"
              value={
                filters.dateFrom
              }
              onChange={(event) =>
                updateFilter(
                  "dateFrom",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            <span>Bitiş</span>

            <input
              type="date"
              value={
                filters.dateTo
              }
              onChange={(event) =>
                updateFilter(
                  "dateTo",
                  event.target.value,
                )
              }
            />
          </label>

          <button
            type="button"
            onClick={
              clearFilters
            }
          >
            Temizle
          </button>
        </section>

        <section className="supplier-content-grid">
          <div className="supplier-transfer-card">
            <div className="supplier-section-heading">
              <div>
                <h2>
                  Atanan Transferler
                </h2>

                <p>
                  {transfers.length}
                  {" kayıt"}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="supplier-empty-state">
                Transferler yükleniyor...
              </div>
            ) : transfers.length ===
              0 ? (
              <div className="supplier-empty-state">
                Atanmış transfer bulunmuyor.
              </div>
            ) : (
              <div className="supplier-transfer-list">
                {transfers.map(
                  (transfer) => (
                    <button
                      key={transfer.id}
                      type="button"
                      className={
                        Number(
                          selectedTransfer
                            ?.id,
                        ) ===
                        Number(
                          transfer.id,
                        )
                          ? "supplier-transfer-row active"
                          : "supplier-transfer-row"
                      }
                      onClick={() =>
                        selectTransfer(
                          transfer,
                        )
                      }
                    >
                      <div>
                        <strong>
                          {
                            transfer
                              .booking_reference
                          }
                        </strong>

                        <span>
                          {formatDateTime(
                            transfer
                              .pickup_time,
                          )}
                        </span>
                      </div>

                      <div>
                        <strong>
                          {transfer
                            .passenger_name ||
                            "Yolcu belirtilmedi"}
                        </strong>

                        <span>
                          {transfer.pickup}
                          {" → "}
                          {transfer.dropoff}
                        </span>
                      </div>

                      <div>
                        <strong className="supplier-amount">
                          {formatMoney(
                            transfer
                              .supplier_amount,
                            transfer
                              .currency,
                          )}
                        </strong>

                        <StatusBadge
                          status={
                            transfer.status
                          }
                        />
                      </div>
                    </button>
                  ),
                )}
              </div>
            )}
          </div>

          <TransferDetailPanel
            transfer={
              selectedTransfer
            }
            loading={
              detailLoading
            }
            onAssigned={
              handleTransferAssigned
            }
            onClose={() =>
              setSelectedTransfer(
                null,
              )
            }
          />
        </section>
      </main>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent = false,
}) {
  return (
    <article
      className={
        accent
          ? "supplier-summary-card accent"
          : "supplier-summary-card"
      }
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </article>
  );
}

function StatusBadge({
  status,
}) {
  return (
    <span
      className={`supplier-status supplier-status-${status}`}
    >
      {STATUS_LABELS[
        status
      ] || status}
    </span>
  );
}

function TransferDetailPanel({
  transfer,
  loading,
  onAssigned,
  onClose,
}) {
  if (!transfer) {
    return (
      <aside className="supplier-detail-card empty">
        <div>
          <h2>
            Transfer Detayı
          </h2>

          <p>
            Detayları görmek için bir
            transfer seçin.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="supplier-detail-card">
      <div className="supplier-detail-header">
        <div>
          <span className="supplier-eyebrow">
            TRANSFER DETAYI
          </span>

          <h2>
            {
              transfer
                .booking_reference
            }
          </h2>
        </div>

        <button
          type="button"
          onClick={
            onClose
          }
        >
          ×
        </button>
      </div>

      {loading ? (
        <div className="supplier-empty-state">
          Detay yükleniyor...
        </div>
      ) : (
        <>
          <div className="supplier-payment-box">
            <span>
              Net Hakediş
            </span>

            <strong>
              {formatMoney(
                transfer
                  .supplier_amount,
                transfer.currency,
              )}
            </strong>
          </div>

          <SupplierTransferAssignment
            transfer={transfer}
            onAssigned={
              onAssigned
            }
          />

          <DetailSection title="Operasyon">
            <DetailRow
              label="Durum"
              value={
                STATUS_LABELS[
                  transfer.status
                ] ||
                transfer.status
              }
            />

            <DetailRow
              label="Alış zamanı"
              value={formatDateTime(
                transfer.pickup_time,
              )}
            />

            <DetailRow
              label="Araç tipi"
              value={
                transfer
                  .vehicle_type ||
                "Belirtilmedi"
              }
            />

            <DetailRow
              label="Uçuş"
              value={
                transfer
                  .flight_number ||
                "Uçuş yok"
              }
            />
          </DetailSection>

          <DetailSection title="Yolcu">
            <DetailRow
              label="Ad Soyad"
              value={
                transfer
                  .passenger_name ||
                "Belirtilmedi"
              }
            />

            <DetailRow
              label="Telefon"
              value={
                transfer
                  .passenger_phone ||
                "Belirtilmedi"
              }
            />

            <DetailRow
              label="Yolcu"
              value={`${transfer.adult || 0} yetişkin, ${transfer.child || 0} çocuk, ${transfer.baby || 0} bebek`}
            />

            <DetailRow
              label="Bagaj"
              value={
                transfer
                  .luggage_count ??
                0
              }
            />
          </DetailSection>

          <DetailSection title="Güzergâh">
            <DetailRow
              label="Alış"
              value={
                transfer.pickup ||
                "Belirtilmedi"
              }
            />

            <DetailRow
              label="Bırakış"
              value={
                transfer.dropoff ||
                "Belirtilmedi"
              }
            />

            <DetailRow
              label="Buluşma noktası"
              value={
                transfer
                  .meet_point ||
                "Belirtilmedi"
              }
            />
          </DetailSection>

          <DetailSection title="Görevli">
            <DetailRow
              label="Sürücü"
              value={
                transfer.driver
                  ?.name ||
                "Henüz atanmadı"
              }
            />

            <DetailRow
              label="Sürücü telefonu"
              value={
                transfer.driver
                  ?.phone ||
                "Belirtilmedi"
              }
            />

            <DetailRow
              label="Araç"
              value={
                getAssignedVehicleLabel(
                  transfer,
                )
              }
            />
          </DetailSection>

          {transfer.status ===
            "cancelled" && (
            <div className="supplier-cancellation-box">
              <strong>
                Transfer iptal edildi
              </strong>

              <p>
                {transfer
                  .cancellation_reason ||
                  "İptal nedeni belirtilmedi."}
              </p>
            </div>
          )}
        </>
      )}
    </aside>
  );
}

function DetailSection({
  title,
  children,
}) {
  return (
    <section className="supplier-detail-section">
      <h3>
        {title}
      </h3>

      <div>
        {children}
      </div>
    </section>
  );
}

function DetailRow({
  label,
  value,
}) {
  return (
    <div className="supplier-detail-row">
      <span>
        {label}
      </span>

      <strong>
        {value ??
          "Belirtilmedi"}
      </strong>
    </div>
  );
}

function getAssignedVehicleLabel(
  transfer,
) {
  const vehicle =
    transfer
      ?.assigned_vehicle ||
    transfer
      ?.driver?.vehicle;

  if (!vehicle) {
    return "Araç atanmadı";
  }

  const details = [
    vehicle.plate ||
      vehicle.license_plate,

    vehicle.brand,

    vehicle.model,
  ].filter(Boolean);

  return details.join(" — ");
}

function formatMoney(
  value,
  currency = "EUR",
) {
  const amount = Number(
    value || 0,
  );

  try {
    return new Intl.NumberFormat(
      "tr-TR",
      {
        style: "currency",
        currency:
          currency || "EUR",
      },
    ).format(amount);
  } catch {
    return `${amount.toFixed(
      2,
    )} ${
      currency || ""
    }`.trim();
  }
}

function formatDateTime(
  value,
) {
  if (!value) {
    return "Tarih belirtilmedi";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    "tr-TR",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}

function getErrorMessage(
  error,
  fallback,
) {
  const validationErrors =
    error?.response?.data
      ?.errors;

  if (validationErrors) {
    const firstError =
      Object.values(
        validationErrors,
      )?.[0]?.[0];

    if (firstError) {
      return firstError;
    }
  }

  return (
    error?.response?.data
      ?.message ||
    error?.message ||
    fallback
  );
}
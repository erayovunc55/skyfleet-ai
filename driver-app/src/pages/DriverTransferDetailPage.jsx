import { useMemo, useState } from "react";

import DriverGpsPanel from "../components/DriverGpsPanel";
import NoShowEvidencePanel from "../components/NoShowEvidencePanel";
import transferService from "../services/transferService";

const STATUS_FLOW = [
  {
    current: "pending",
    next: "accepted",
    label: "Transferi Kabul Et",
    icon: "✓",
  },
  {
    current: "accepted",
    next: "on_the_way",
    label: "Yola Çık",
    icon: "🚐",
  },
  {
    current: "on_the_way",
    next: "arrived",
    label: "Alış Noktasındayım",
    icon: "📍",
  },
  {
    current: "arrived",
    next: "passenger_called",
    label: "Yolcuyu Aradım",
    icon: "☎",
  },
  {
    current: "passenger_called",
    next: "passenger_on_board",
    label: "Yolcu Geldi",
    icon: "👤",
  },
  {
    current: "passenger_on_board",
    next: "trip_started",
    label: "Yolculuğu Başlat",
    icon: "▶",
  },
  {
    current: "trip_started",
    next: "completed",
    label: "Transferi Tamamla",
    icon: "🏁",
  },
];

const NO_SHOW_ALLOWED_STATUSES = [
  "arrived",
  "passenger_called",
];

export default function DriverTransferDetailPage({
  initialTransfer,
  onBack,
  onTransferUpdated,
}) {
  const [transfer, setTransfer] =
    useState(initialTransfer);

  const [showNoShowEvidence, setShowNoShowEvidence] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const nextAction = useMemo(
    () =>
      STATUS_FLOW.find(
        (item) =>
          item.current === transfer.status,
      ) || null,
    [transfer.status],
  );

  const canCreateNoShowEvidence =
    NO_SHOW_ALLOWED_STATUSES.includes(
      transfer.status,
    );

  async function updateStatus(
    status,
    note = null,
  ) {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response =
        await transferService.updateStatus(
          transfer.id,
          status,
          note,
        );

      const updatedTransfer =
        response?.data || transfer;

      setTransfer(updatedTransfer);

      onTransferUpdated?.(
        updatedTransfer,
      );

      setMessage(
        response?.message ||
          "Transfer durumu güncellendi.",
      );

      return updatedTransfer;
    } catch (requestError) {
      const validationErrors =
        requestError?.response?.data?.errors;

      const validationMessage =
        validationErrors
          ? Object.values(validationErrors)
              .flat()
              .find(Boolean)
          : null;

      setError(
        validationMessage ||
          requestError?.response?.data?.message ||
          requestError?.message ||
          "İşlem tamamlanamadı.",
      );

      return null;
    } finally {
      setSaving(false);
    }
  }

  function callPassenger() {
    setError("");
    setMessage("");

    const phone = normalizePhone(
      transfer.passenger_phone,
    );

    if (!phone) {
      setError(
        "Yolcu telefon bilgisi bulunmuyor.",
      );
      return;
    }

    window.location.href =
      `tel:${phone}`;
  }

  function openWhatsApp() {
    setError("");
    setMessage("");

    const phone = normalizePhone(
      transfer.passenger_phone,
    );

    if (!phone) {
      setError(
        "Yolcu telefon bilgisi bulunmuyor.",
      );
      return;
    }

    const whatsappMessage =
      createWhatsAppMessage(
        transfer,
      );

    const url =
      `https://wa.me/${phone}` +
      `?text=${encodeURIComponent(
        whatsappMessage,
      )}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function openNavigation(type) {
    setError("");
    setMessage("");

    const destination =
      type === "pickup"
        ? getLocationDestination(
            transfer.pickup_location,
            transfer.pickup_lat,
            transfer.pickup_lng,
            transfer.pickup,
          )
        : getLocationDestination(
            transfer.dropoff_location,
            transfer.dropoff_lat,
            transfer.dropoff_lng,
            transfer.dropoff,
          );

    if (!destination) {
      setError(
        "Navigasyon için konum bilgisi bulunmuyor.",
      );
      return;
    }

    const url =
      "https://www.google.com/maps/dir/" +
      `?api=1&destination=${encodeURIComponent(
        destination,
      )}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function openNoShowEvidence() {
    setError("");
    setMessage("");
    setShowNoShowEvidence(true);
  }

  async function handleEvidenceSaved() {
    setShowNoShowEvidence(false);

    await updateStatus(
      "no_show",
      "No Show fotoğraf kanıtı yüklenerek sürücü tarafından kaydedildi.",
    );
  }

  function handlePrimaryAction() {
    if (!nextAction || saving) {
      return;
    }

    updateStatus(nextAction.next);
  }

  return (
    <main className="driver-detail-page">
      <header className="driver-detail-header">
        <button
          type="button"
          onClick={onBack}
          aria-label="Transfer listesine dön"
        >
          ←
        </button>

        <div>
          <small>
            {transfer.booking_reference ||
              `TRANSFER #${transfer.id}`}
          </small>

          <h1>Transfer Detayı</h1>
        </div>

        <StatusPill
          status={transfer.status}
        />
      </header>

      <section className="driver-route-card">
        <RoutePoint
          tone="pickup"
          label="Alış"
          value={getPickupLabel(
            transfer,
          )}
          secondary={
            transfer.pickup_point?.name ||
            transfer.meet_point
          }
        />

        <div className="driver-route-line" />

        <RoutePoint
          tone="dropoff"
          label="Bırakış"
          value={getDropoffLabel(
            transfer,
          )}
          secondary={
            transfer.dropoff_point?.name
          }
        />

        <div className="driver-route-actions">
          <button
            type="button"
            onClick={() =>
              openNavigation("pickup")
            }
          >
            📍 Pickup’a Git
          </button>

          <button
            type="button"
            onClick={() =>
              openNavigation("dropoff")
            }
          >
            🏁 Dropoff’a Git
          </button>
        </div>
      </section>

      <section className="driver-detail-grid">
        <InfoCard title="Yolcu">
          <InfoRow
            label="Ad Soyad"
            value={
              transfer.passenger_name ||
              "Belirtilmedi"
            }
          />

          <InfoRow
            label="Telefon"
            value={
              transfer.passenger_phone ||
              "Belirtilmedi"
            }
          />

          <InfoRow
            label="Yolcu"
            value={`${getPassengerCount(
              transfer,
            )} kişi`}
          />

          <InfoRow
            label="Bagaj"
            value={`${Number(
              transfer.luggage_count || 0,
            )} adet`}
          />

          <div className="driver-contact-actions">
            <button
              type="button"
              onClick={callPassenger}
            >
              ☎ Yolcuyu Ara
            </button>

            <button
              type="button"
              onClick={openWhatsApp}
            >
              💬 WhatsApp
            </button>
          </div>
        </InfoCard>

        <InfoCard title="Uçuş">
          <InfoRow
            label="Uçuş"
            value={
              transfer.flight_number ||
              "Belirtilmedi"
            }
          />

          <InfoRow
            label="Havayolu"
            value={
              transfer.airline ||
              "Belirtilmedi"
            }
          />

          <InfoRow
            label="Terminal"
            value={
              transfer.terminal ||
              "Belirtilmedi"
            }
          />

          <InfoRow
            label="Alış Saati"
            value={formatDateTime(
              transfer.pickup_time,
            )}
          />
        </InfoCard>

        <InfoCard title="Rezervasyon">
          <InfoRow
            label="Referans"
            value={
              transfer.booking_reference ||
              `#${transfer.id}`
            }
          />

          <InfoRow
            label="Kaynak"
            value={
              transfer.ota_source ||
              transfer.supplier ||
              "Belirtilmedi"
            }
          />

          <InfoRow
            label="Araç Tipi"
            value={
              transfer.vehicle_type ||
              "Belirtilmedi"
            }
          />

          <InfoRow
            label="Buluşma Noktası"
            value={
              transfer.meet_point ||
              transfer.pickup_point?.name ||
              "Belirtilmedi"
            }
          />
        </InfoCard>

        <InfoCard title="Notlar">
          <div className="driver-note">
            <span>Sürücü notu</span>

            <p>
              {transfer.driver_note ||
                "Sürücü notu bulunmuyor."}
            </p>
          </div>

          <div className="driver-note">
            <span>Yolcu notu</span>

            <p>
              {transfer.passenger_note ||
                "Yolcu notu bulunmuyor."}
            </p>
          </div>
        </InfoCard>
      </section>

      <DriverGpsPanel
        transferId={transfer.id}
      />

      {showNoShowEvidence && (
        <NoShowEvidencePanel
          transfer={transfer}
          onCancel={() =>
            setShowNoShowEvidence(
              false,
            )
          }
          onEvidenceSaved={
            handleEvidenceSaved
          }
        />
      )}

      {error && (
        <div className="driver-action-message error">
          {error}
        </div>
      )}

      {message && (
        <div className="driver-action-message success">
          {message}
        </div>
      )}

      <section className="driver-operation-panel">
        <span>
          SONRAKİ OPERASYON ADIMI
        </span>

        {nextAction ? (
          <button
            className="driver-primary-action"
            type="button"
            disabled={
              saving ||
              showNoShowEvidence
            }
            onClick={
              handlePrimaryAction
            }
          >
            <strong>
              {nextAction.icon}
            </strong>

            <span>
              {saving
                ? "Güncelleniyor..."
                : nextAction.label}
            </span>
          </button>
        ) : (
          <OperationResult
            status={transfer.status}
          />
        )}

        {canCreateNoShowEvidence &&
          !showNoShowEvidence && (
            <button
              className="driver-no-show-button"
              type="button"
              disabled={saving}
              onClick={
                openNoShowEvidence
              }
            >
              Yolcu Gelmedi — No Show
            </button>
          )}
      </section>
    </main>
  );
}

function InfoCard({
  title,
  children,
}) {
  return (
    <section className="driver-info-card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function InfoRow({
  label,
  value,
}) {
  return (
    <div className="driver-info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RoutePoint({
  tone,
  label,
  value,
  secondary,
}) {
  return (
    <div className="driver-route-point">
      <div
        className={`driver-route-dot ${tone}`}
      />

      <div>
        <span>{label}</span>

        <strong>{value}</strong>

        {secondary && (
          <small>{secondary}</small>
        )}
      </div>
    </div>
  );
}

function StatusPill({
  status,
}) {
  return (
    <span
      className={
        `driver-status-pill ` +
        `driver-status-${status}`
      }
    >
      {getStatusLabel(status)}
    </span>
  );
}

function OperationResult({
  status,
}) {
  let text =
    "Yeni işlem bulunmuyor";

  if (status === "completed") {
    text =
      "✓ Transfer tamamlandı";
  }

  if (status === "no_show") {
    text =
      "Yolcu No Show olarak işaretlendi";
  }

  if (status === "cancelled") {
    text =
      "Transfer iptal edildi";
  }

  return (
    <div className="driver-operation-complete">
      {text}
    </div>
  );
}

function getPickupLabel(
  transfer,
) {
  return (
    transfer.pickup_location?.name ||
    transfer.pickup ||
    "Alış noktası"
  );
}

function getDropoffLabel(
  transfer,
) {
  return (
    transfer.dropoff_location?.name ||
    transfer.dropoff ||
    "Bırakış noktası"
  );
}

function getPassengerCount(
  transfer,
) {
  const count =
    Number(transfer.adult || 0) +
    Number(transfer.child || 0) +
    Number(transfer.baby || 0);

  return count > 0 ? count : 1;
}

function normalizePhone(value) {
  if (!value) {
    return "";
  }

  let phone = String(value).replace(
    /\D/g,
    "",
  );

  if (phone.startsWith("00")) {
    phone = phone.slice(2);
  }

  if (
    phone.length === 10 &&
    phone.startsWith("5")
  ) {
    phone = `90${phone}`;
  }

  if (
    phone.length === 11 &&
    phone.startsWith("0")
  ) {
    phone =
      `90${phone.slice(1)}`;
  }

  return phone;
}

function getLocationDestination(
  location,
  latitude,
  longitude,
  fallback,
) {
  const lat = Number(
    location?.latitude ??
      latitude,
  );

  const lng = Number(
    location?.longitude ??
      longitude,
  );

  if (
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  ) {
    return `${lat},${lng}`;
  }

  return (
    location?.name ||
    fallback ||
    ""
  );
}

function createWhatsAppMessage(
  transfer,
) {
  const passenger =
    transfer.passenger_name ||
    "Değerli misafirimiz";

  const meetingPoint =
    transfer.pickup_point?.name ||
    transfer.meet_point ||
    getPickupLabel(transfer);

  return [
    `Merhaba ${passenger},`,
    "",
    "Ben SkyTrip Transfer sürücünüzüm.",
    `Rezervasyon numaranız: ${
      transfer.booking_reference ||
      "-"
    }`,
    `Buluşma noktası: ${meetingPoint}`,
    "",
    "Transferiniz için sizinle iletişime geçiyorum.",
  ].join("\n");
}

function getStatusLabel(
  status,
) {
  const labels = {
    pending: "Bekliyor",
    accepted: "Kabul Edildi",
    on_the_way: "Yola Çıkıldı",
    arrived: "Alış Noktasında",
    passenger_called:
      "Yolcu Arandı",
    passenger_on_board:
      "Yolcu Geldi",
    trip_started:
      "Yolculuk Başladı",
    completed: "Tamamlandı",
    no_show: "No Show",
    cancelled: "İptal Edildi",
  };

  return (
    labels[status] ||
    status ||
    "Bilinmiyor"
  );
}

function formatDateTime(value) {
  if (!value) {
    return "Belirtilmedi";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return String(value);
  }

  return date.toLocaleString(
    "tr-TR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}
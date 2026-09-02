import {
  useCallback,
  useEffect,
  useState,
} from "react";

import transferService from "../services/transferService";

const CONTACT_RESULT_LABELS = {
  unreachable: "Ulaşılamadı",
  phone_off: "Telefon kapalı",
  wrong_number: "Numara hatalı",
  answered_needs_time: "Cevap verdi, süre istedi",
  other: "Diğer",
};

export default function TransferEvidenceCard({
  transfer,
}) {
  const [evidences, setEvidences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadEvidences = useCallback(async () => {
    if (!transfer?.id) {
      setEvidences([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const items =
        await transferService.getTransferEvidences(
          transfer.id,
        );

      setEvidences(items);
    } catch (requestError) {
      setEvidences([]);
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Operasyon kanıtları yüklenemedi.",
      );
    } finally {
      setLoading(false);
    }
  }, [transfer?.id]);

  useEffect(() => {
    loadEvidences();
  }, [loadEvidences]);

  return (
    <section className="transfer-evidence-card">
      <header className="transfer-evidence-card-header">
        <div>
          <span>OPERASYON KANITI</span>
          <h3>No Show Kanıtları</h3>
          <p>
            Fotoğraf, GPS, bekleme ve iletişim kayıtları.
          </p>
        </div>

        <div className="transfer-evidence-card-actions">
          <span className="transfer-evidence-count">
            {evidences.length} kayıt
          </span>

          <button
            type="button"
            disabled={loading}
            onClick={loadEvidences}
          >
            {loading ? "Yükleniyor..." : "Yenile"}
          </button>
        </div>
      </header>

      {loading && evidences.length === 0 && (
        <div className="transfer-evidence-state">
          Kanıt kayıtları yükleniyor...
        </div>
      )}

      {error && (
        <div className="transfer-evidence-state error">
          {error}
        </div>
      )}

      {!loading && !error && evidences.length === 0 && (
        <div className="transfer-evidence-state empty">
          <strong>Henüz kanıt kaydı yok.</strong>
          <span>
            Sürücü No Show kaydı oluşturduğunda fotoğraf ve
            operasyon bilgileri burada görüntülenecek.
          </span>
        </div>
      )}

      {evidences.length > 0 && (
        <div className="transfer-evidence-list">
          {evidences.map((evidence) => (
            <EvidenceItem
              key={evidence.id}
              evidence={evidence}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function EvidenceItem({ evidence }) {
  const hasCoordinates =
    Number.isFinite(Number(evidence.latitude)) &&
    Number.isFinite(Number(evidence.longitude));

  const mapUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${evidence.latitude},${evidence.longitude}`
    : "";

  return (
    <article className="transfer-evidence-item">
      <div className="transfer-evidence-photo">
        {evidence.file_url ? (
          <a
            href={evidence.file_url}
            target="_blank"
            rel="noreferrer"
            title="Kanıt fotoğrafını aç"
          >
            <img
              src={evidence.file_url}
              alt="No Show kanıtı"
              loading="lazy"
            />
            <span>Fotoğrafı büyüt ↗</span>
          </a>
        ) : (
          <div className="transfer-evidence-photo-empty">
            <span>📷</span>
            Fotoğraf bulunamadı
          </div>
        )}
      </div>

      <div className="transfer-evidence-content">
        <div className="transfer-evidence-item-title">
          <div>
            <span>NO SHOW KAYDI</span>
            <strong>
              {formatDateTime(evidence.recorded_at)}
            </strong>
          </div>

          <span className="transfer-evidence-verified">
            Doğrulandı
          </span>
        </div>

        <dl className="transfer-evidence-grid">
          <EvidenceField
            label="Sürücü"
            value={evidence.driver?.name || "Belirtilmedi"}
          />
          <EvidenceField
            label="Bekleme"
            value={formatMinutes(evidence.wait_minutes)}
          />
          <EvidenceField
            label="Arama Denemesi"
            value={formatCount(evidence.call_attempts)}
          />
          <EvidenceField
            label="İletişim Sonucu"
            value={getContactResultLabel(evidence.contact_result)}
          />
          <EvidenceField
            label="Yolcu Arandı"
            value={formatBoolean(evidence.passenger_called)}
          />
          <EvidenceField
            label="WhatsApp Denendi"
            value={formatBoolean(evidence.whatsapp_attempted)}
          />
          <EvidenceField
            label="GPS"
            value={
              hasCoordinates
                ? `${formatCoordinate(evidence.latitude)}, ${formatCoordinate(evidence.longitude)}`
                : "Konum yok"
            }
          />
          <EvidenceField
            label="Konum Hassasiyeti"
            value={formatAccuracy(evidence.accuracy)}
          />
        </dl>

        {evidence.note && (
          <div className="transfer-evidence-note">
            <span>SÜRÜCÜ AÇIKLAMASI</span>
            <p>{evidence.note}</p>
          </div>
        )}

        {mapUrl && (
          <a
            className="transfer-evidence-map-link"
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
          >
            📍 Konumu haritada aç
          </a>
        )}
      </div>
    </article>
  );
}

function EvidenceField({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) {
    return "Tarih belirtilmedi";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Tarih belirtilmedi";
  }

  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMinutes(value) {
  const minutes = Number(value);
  return Number.isFinite(minutes)
    ? `${minutes} dakika`
    : "Belirtilmedi";
}

function formatCount(value) {
  const count = Number(value);
  return Number.isFinite(count)
    ? `${count} kez`
    : "Belirtilmedi";
}

function formatBoolean(value) {
  return Boolean(value) ? "Evet" : "Hayır";
}

function formatAccuracy(value) {
  const accuracy = Number(value);
  return Number.isFinite(accuracy)
    ? `±${Math.round(accuracy)} metre`
    : "Belirtilmedi";
}

function formatCoordinate(value) {
  const coordinate = Number(value);
  return Number.isFinite(coordinate)
    ? coordinate.toFixed(6)
    : "--";
}

function getContactResultLabel(value) {
  return CONTACT_RESULT_LABELS[value] ||
    value ||
    "Belirtilmedi";
}

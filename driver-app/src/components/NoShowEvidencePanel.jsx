import {
  useEffect,
  useState,
} from "react";

import evidenceService from "../services/evidenceService";

export default function NoShowEvidencePanel({
  transfer,
  onEvidenceSaved,
  onCancel,
}) {
  const [photo, setPhoto] =
    useState(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [location, setLocation] =
    useState(null);

  const [note, setNote] =
    useState("");

  const [locating, setLocating] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    if (!photo) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl =
      URL.createObjectURL(photo);

    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(
        objectUrl,
      );
    };
  }, [photo]);

  function requestLocation() {
    setError("");
    setMessage("");

    if (!navigator.geolocation) {
      setLocating(false);

      setError(
        "Bu cihaz konum hizmetlerini desteklemiyor.",
      );

      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude:
            position.coords.latitude,

          longitude:
            position.coords.longitude,

          accuracy:
            position.coords.accuracy,

          recordedAt:
            new Date(
              position.timestamp,
            ).toISOString(),
        });

        setLocating(false);
      },

      (positionError) => {
        setLocation(null);
        setLocating(false);

        setError(
          getLocationErrorMessage(
            positionError,
          ),
        );
      },

      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 3000,
      },
    );
  }

  function handlePhotoChange(
    event,
  ) {
    setError("");
    setMessage("");

    const selectedPhoto =
      event.target.files?.[0];

    if (!selectedPhoto) {
      setPhoto(null);
      return;
    }

    if (
      !selectedPhoto.type.startsWith(
        "image/",
      )
    ) {
      setPhoto(null);

      setError(
        "Lütfen geçerli bir fotoğraf çekin veya seçin.",
      );

      return;
    }

    const maximumFileSize =
      10 * 1024 * 1024;

    if (
      selectedPhoto.size >
      maximumFileSize
    ) {
      setPhoto(null);

      setError(
        "Fotoğraf en fazla 10 MB olabilir.",
      );

      return;
    }

    setPhoto(selectedPhoto);
  }

  async function handleSave() {
    if (!photo) {
      setError(
        "No Show kanıtı için fotoğraf çekmelisiniz.",
      );

      return;
    }

    if (!location) {
      setError(
        "GPS konumu alınmadan kanıt kaydedilemez.",
      );

      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response =
        await evidenceService.uploadNoShowEvidence({
          transferId:
            transfer.id,

          photo,

          location,

          note,
        });

      setMessage(
        response?.message ||
          "No Show kanıtı başarıyla kaydedildi.",
      );

      await onEvidenceSaved?.(
        response?.data,
      );
    } catch (requestError) {
      const validationErrors =
        requestError?.response?.data
          ?.errors;

      const firstValidationError =
        validationErrors
          ? Object.values(
              validationErrors,
            )
              .flat()
              .find(Boolean)
          : null;

      setError(
        firstValidationError ||
          requestError?.response?.data
            ?.message ||
          requestError?.message ||
          "No Show kanıtı yüklenemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="no-show-evidence-card">
      <div className="no-show-evidence-header">
        <div>
          <span>
            OPERASYON KANITI
          </span>

          <h2>
            No Show Kaydı
          </h2>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          aria-label="No Show ekranını kapat"
        >
          ✕
        </button>
      </div>

      <div className="no-show-warning">
        Yolcunun buluşma noktasına
        gelmediğini gösteren net bir
        fotoğraf çekin. GPS konumu ve kayıt
        zamanı otomatik olarak
        eklenecektir.
      </div>

      <label className="no-show-photo-input">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          disabled={saving}
          onChange={
            handlePhotoChange
          }
        />

        {previewUrl ? (
          <div className="no-show-photo-preview">
            <img
              src={previewUrl}
              alt="No Show kanıtı"
            />

            <span>
              Fotoğrafı değiştirmek için dokunun
            </span>
          </div>
        ) : (
          <div className="no-show-photo-empty">
            <strong>📷</strong>

            <span>
              Fotoğraf Çek
            </span>

            <small>
              Telefonun arka kamerası
              açılacaktır
            </small>
          </div>
        )}
      </label>

      <div className="no-show-location-box">
        <div>
          <span>
            GPS Durumu
          </span>

          <strong>
            {locating
              ? "Konum alınıyor..."
              : location
                ? "Konum hazır"
                : "Konum alınamadı"}
          </strong>
        </div>

        <button
          type="button"
          disabled={
            locating ||
            saving
          }
          onClick={
            requestLocation
          }
        >
          {locating
            ? "Bekleyin"
            : "GPS Yenile"}
        </button>
      </div>

      {location && (
        <div className="no-show-location-details">
          <div>
            <span>Enlem</span>

            <strong>
              {Number(
                location.latitude,
              ).toFixed(7)}
            </strong>
          </div>

          <div>
            <span>Boylam</span>

            <strong>
              {Number(
                location.longitude,
              ).toFixed(7)}
            </strong>
          </div>

          <div>
            <span>Hassasiyet</span>

            <strong>
              ±
              {Math.round(
                Number(
                  location.accuracy ||
                    0,
                ),
              )}{" "}
              metre
            </strong>
          </div>

          <div>
            <span>Kayıt Saati</span>

            <strong>
              {formatDateTime(
                location.recordedAt,
              )}
            </strong>
          </div>
        </div>
      )}

      <label className="no-show-note-field">
        <span>
          Sürücü Açıklaması
        </span>

        <textarea
          rows="4"
          maxLength="2000"
          value={note}
          disabled={saving}
          placeholder="Örnek: Yolcu 25 dakika beklendi. Telefon ve WhatsApp üzerinden ulaşılamadı."
          onChange={(event) =>
            setNote(
              event.target.value,
            )
          }
        />

        <small>
          {note.length}/2000
        </small>
      </label>

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

      <div className="no-show-evidence-actions">
        <button
          className="no-show-cancel-button"
          type="button"
          disabled={saving}
          onClick={onCancel}
        >
          Vazgeç
        </button>

        <button
          className="no-show-save-button"
          type="button"
          disabled={
            saving ||
            locating ||
            !photo ||
            !location
          }
          onClick={handleSave}
        >
          {saving
            ? "Kanıt yükleniyor..."
            : "Kanıtı Kaydet ve No Show Yap"}
        </button>
      </div>
    </section>
  );
}

function getLocationErrorMessage(
  error,
) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Konum izni verilmedi. Tarayıcı ayarlarından konum iznini açın.";

    case error.POSITION_UNAVAILABLE:
      return "Cihaz konumu belirlenemedi. Telefonun GPS hizmetini kontrol edin.";

    case error.TIMEOUT:
      return "Konum alınırken zaman aşımı oluştu. Tekrar deneyin.";

    default:
      return "Konum alınamadı.";
  }
}

function formatDateTime(value) {
  if (!value) {
    return "Bilinmiyor";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Bilinmiyor";
  }

  return date.toLocaleString(
    "tr-TR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    },
  );
}
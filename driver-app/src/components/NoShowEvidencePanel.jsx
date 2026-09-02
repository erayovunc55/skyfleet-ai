import { useEffect, useState } from "react";
import evidenceService from "../services/evidenceService";

const LOCATION_CACHE_KEY =
  "skyfleet_driver_last_location";

const LOCATION_CACHE_MAX_AGE =
  10 * 60 * 1000;

const fieldStyle = {
  width: "100%",
  padding: "11px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "12px",
  background: "#fff",
  color: "#0f172a",
};

export default function NoShowEvidencePanel({ transfer, onEvidenceSaved, onCancel }) {
  const transferEvents = Array.isArray(transfer?.events) ? transfer.events : [];
  const systemCallAttempts = transferEvents.filter(
    (event) => event?.event_type === "passenger_call_attempted",
  ).length;
  const systemWhatsappAttempted = transferEvents.some(
    (event) => event?.event_type === "passenger_whatsapp_opened",
  );
  const [photo, setPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [location, setLocation] = useState(null);
  const [note, setNote] = useState("");
  const [waitMinutes, setWaitMinutes] = useState(20);
  const [callAttempts, setCallAttempts] = useState(systemCallAttempts);
  const [passengerCalled, setPassengerCalled] = useState(systemCallAttempts > 0);
  const [whatsappAttempted, setWhatsappAttempted] = useState(systemWhatsappAttempted);
  const [checkingContact, setCheckingContact] = useState(true);
  const [contactResult, setContactResult] = useState("unreachable");
  const [locating, setLocating] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => requestLocation(), []);

  useEffect(() => {
    let mounted = true;
    evidenceService.getContactSummary(transfer.id)
      .then((summary) => {
        if (!mounted) return;
        setCallAttempts(summary.callAttempts);
        setPassengerCalled(summary.callAttempts > 0);
        setWhatsappAttempted(summary.whatsappAttempted);
      })
      .catch(() => {
        if (mounted) setError("İletişim kayıtları kontrol edilemedi.");
      })
      .finally(() => {
        if (mounted) setCheckingContact(false);
      });
    return () => { mounted = false; };
  }, [transfer.id]);

  useEffect(() => {
    if (!photo) {
      setPreviewUrl("");
      return undefined;
    }
    const objectUrl = URL.createObjectURL(photo);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);

  function requestLocation() {
    setError("");

    const cachedLocation =
      getCachedLocation();

    if (cachedLocation) {
      setLocation(cachedLocation);
    }

    if (!navigator.geolocation) {
      setLocating(false);
      if (!cachedLocation) {
        setError("Bu cihaz konum hizmetlerini desteklemiyor.");
      }
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      () => {
        navigator.geolocation.getCurrentPosition(
          handleLocationSuccess,
          (positionError) => {
            setLocating(false);

            if (!cachedLocation) {
              setLocation(null);
              setError(
                getLocationErrorMessage(
                  positionError,
                ),
              );
            }
          },
          {
            enableHighAccuracy: false,
            timeout: 12000,
            maximumAge: LOCATION_CACHE_MAX_AGE,
          },
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      },
    );
  }

  function handleLocationSuccess(position) {
    const nextLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      recordedAt: new Date(
        position.timestamp,
      ).toISOString(),
    };

    setLocation(nextLocation);
    setLocating(false);
    setError("");

    try {
      sessionStorage.setItem(
        LOCATION_CACHE_KEY,
        JSON.stringify(nextLocation),
      );
    } catch {
      // Tarayıcı depolaması kapalıysa kayıt yine devam eder.
    }
  }

  function handlePhotoChange(event) {
    setError("");
    const selectedPhoto = event.target.files?.[0];
    if (!selectedPhoto) return setPhoto(null);
    if (!selectedPhoto.type.startsWith("image/")) {
      setPhoto(null);
      return setError("Lütfen geçerli bir fotoğraf çekin veya seçin.");
    }
    if (selectedPhoto.size > 10 * 1024 * 1024) {
      setPhoto(null);
      return setError("Fotoğraf en fazla 10 MB olabilir.");
    }
    setPhoto(selectedPhoto);
  }

  async function handleSave() {
    if (!photo) return setError("No Show kanıtı için fotoğraf çekmelisiniz.");
    if (!location) return setError("GPS konumu alınmadan kanıt kaydedilemez.");
    if (!passengerCalled) return setError("Yolcuyu aradığınızı onaylamalısınız.");
    if (Number(callAttempts) < 1) return setError("En az bir arama denemesi girilmelidir.");
    if (Number(waitMinutes) < 1) return setError("Bekleme süresi girilmelidir.");

    setSaving(true);
    setError("");
    try {
      const response = await evidenceService.uploadNoShowEvidence({
        transferId: transfer.id,
        photo,
        location,
        note,
        details: {
          waitMinutes: Number(waitMinutes),
          callAttempts: Number(callAttempts),
          passengerCalled,
          whatsappAttempted,
          contactResult,
        },
      });
      await onEvidenceSaved?.(response?.data);
    } catch (requestError) {
      const errors = requestError?.response?.data?.errors;
      setError(
        (errors && Object.values(errors).flat().find(Boolean)) ||
          requestError?.response?.data?.message ||
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
        <div><span>OPERASYON KANITI</span><h2>No Show Kaydı</h2></div>
        <button type="button" disabled={saving} onClick={onCancel} aria-label="Kapat">✕</button>
      </div>

      <div className="no-show-warning">
        Fotoğraf, GPS, bekleme süresi ve iletişim denemeleri kanıt kaydına eklenecektir.
      </div>

      <label className="no-show-photo-input">
        <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={saving} onChange={handlePhotoChange} />
        {previewUrl ? (
          <div className="no-show-photo-preview"><img src={previewUrl} alt="No Show kanıtı" /><span>Fotoğrafı değiştirmek için dokunun</span></div>
        ) : (
          <div className="no-show-photo-empty"><strong>📷</strong><span>Fotoğraf Çek</span><small>Telefonun arka kamerası açılacaktır</small></div>
        )}
      </label>

      <div className="no-show-location-box">
        <div><span>GPS Durumu</span><strong>{locating ? "Konum alınıyor..." : location ? "Konum hazır" : "Konum alınamadı"}</strong></div>
        <button type="button" disabled={locating || saving} onClick={requestLocation}>{locating ? "Bekleyin" : "GPS Yenile"}</button>
      </div>

      {location && (
        <div className="no-show-location-details">
          <div><span>Enlem</span><strong>{Number(location.latitude).toFixed(7)}</strong></div>
          <div><span>Boylam</span><strong>{Number(location.longitude).toFixed(7)}</strong></div>
          <div><span>Hassasiyet</span><strong>±{Math.round(Number(location.accuracy || 0))} metre</strong></div>
          <div><span>Kayıt Saati</span><strong>{formatDateTime(location.recordedAt)}</strong></div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px", marginTop: "16px" }}>
        <label><span>Bekleme Süresi</span><select style={fieldStyle} value={waitMinutes} disabled={saving} onChange={(e) => setWaitMinutes(e.target.value)}>{[10,15,20,25,30,45,50,60,90].map((v) => <option key={v} value={v}>{v} dakika</option>)}</select></label>
        <label><span>Arama Denemesi (Sistem Kaydı)</span><input style={fieldStyle} type="number" value={callAttempts} disabled readOnly /></label>
        <label><span>İletişim Sonucu</span><select style={fieldStyle} value={contactResult} disabled={saving} onChange={(e) => setContactResult(e.target.value)}><option value="unreachable">Ulaşılamadı</option><option value="phone_off">Telefon kapalı</option><option value="wrong_number">Numara hatalı</option><option value="answered_needs_time">Cevap verdi, süre istedi</option><option value="other">Diğer</option></select></label>
        <div style={{ display: "grid", gap: "8px", alignContent: "end" }}>
          <label><input type="checkbox" checked={passengerCalled} disabled readOnly /> Yolcu arandı (sistem)</label>
          <label><input type="checkbox" checked={whatsappAttempted} disabled readOnly /> WhatsApp açıldı (sistem)</label>
        </div>
      </div>

      <label className="no-show-note-field"><span>Sürücü Açıklaması</span><textarea rows="4" maxLength="2000" value={note} disabled={saving} placeholder="Örnek: Yolcu 25 dakika beklendi. Telefon ve WhatsApp üzerinden ulaşılamadı." onChange={(e) => setNote(e.target.value)} /><small>{note.length}/2000</small></label>
      {error && <div className="driver-action-message error">{error}</div>}
      <div className="no-show-evidence-actions">
        <button className="no-show-cancel-button" type="button" disabled={saving} onClick={onCancel}>Vazgeç</button>
        <button className="no-show-save-button" type="button" disabled={saving || locating || checkingContact || !photo || !location || !passengerCalled} onClick={handleSave}>{saving ? "Kanıt yükleniyor..." : checkingContact ? "İletişim kayıtları kontrol ediliyor..." : "Kanıtı Kaydet ve No Show Yap"}</button>
      </div>
    </section>
  );
}

function getCachedLocation() {
  try {
    const rawValue = sessionStorage.getItem(
      LOCATION_CACHE_KEY,
    );

    if (!rawValue) {
      return null;
    }

    const value = JSON.parse(rawValue);
    const recordedAt = new Date(
      value.recordedAt,
    ).getTime();

    if (
      !Number.isFinite(Number(value.latitude)) ||
      !Number.isFinite(Number(value.longitude)) ||
      !Number.isFinite(recordedAt) ||
      Date.now() - recordedAt >
        LOCATION_CACHE_MAX_AGE
    ) {
      return null;
    }

    return value;
  } catch {
    return null;
  }
}

function getLocationErrorMessage(error) {
  if (error.code === error.PERMISSION_DENIED) return "Konum izni verilmedi. Tarayıcı ayarlarından konum iznini açın.";
  if (error.code === error.POSITION_UNAVAILABLE) return "Cihaz konumu belirlenemedi. Telefonun GPS hizmetini kontrol edin.";
  if (error.code === error.TIMEOUT) return "Konum alınırken zaman aşımı oluştu. Tekrar deneyin.";
  return "Konum alınamadı.";
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Bilinmiyor";
  return date.toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

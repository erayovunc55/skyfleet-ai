import { useEffect, useRef, useState } from "react";
import TripTimeline from "../components/TripTimeline";
import { sendTransferEvent } from "../services/transferEventService";
import { sendDriverLocation } from "../services/driverLocationService";

export default function TransferDetailPage({
  transfer,
  onBack,
}) {
  const [tripStep, setTripStep] = useState(
    getStepFromStatus(transfer.status),
  );

  const [currentStatus, setCurrentStatus] = useState(
    transfer.status,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventError, setEventError] = useState("");
  const [isLiveTracking, setIsLiveTracking] = useState(false);

  const watchIdRef = useRef(null);
  const lastSentAtRef = useRef(0);

  function getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(
          new Error(
            "Bu cihaz GPS konumunu desteklemiyor.",
          ),
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          let message =
            "Konum alınamadı. Tarayıcı konum iznini kontrol edin.";

          if (error.code === error.PERMISSION_DENIED) {
            message =
              "Konum izni reddedildi. Tarayıcı ayarlarından konum izni vermelisiniz.";
          }

          if (error.code === error.POSITION_UNAVAILABLE) {
            message =
              "Cihazın mevcut konumu belirlenemedi.";
          }

          if (error.code === error.TIMEOUT) {
            message =
              "Konum alınırken zaman aşımı oluştu.";
          }

          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        },
      );
    });
  }

  function stopLiveTracking() {
    if (
      watchIdRef.current !== null &&
      navigator.geolocation
    ) {
      navigator.geolocation.clearWatch(
        watchIdRef.current,
      );
    }

    watchIdRef.current = null;
    lastSentAtRef.current = 0;
    setIsLiveTracking(false);
  }

  function startLiveTracking() {
    if (!navigator.geolocation) {
      setEventError(
        "Bu cihaz canlı GPS takibini desteklemiyor.",
      );
      return;
    }

    stopLiveTracking();
    setEventError("");
    setIsLiveTracking(true);

    watchIdRef.current =
      navigator.geolocation.watchPosition(
        async (position) => {
          const now = Date.now();

          // Konumu yaklaşık 5 saniyede bir gönderir.
          if (now - lastSentAtRef.current < 5000) {
            return;
          }

          lastSentAtRef.current = now;

          try {
            await sendDriverLocation(transfer.id, {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              speed:
                position.coords.speed === null
                  ? null
                  : position.coords.speed,
              heading:
                position.coords.heading === null
                  ? null
                  : position.coords.heading,
            });

            console.log("Canlı konum gönderildi:", {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              speed: position.coords.speed,
              heading: position.coords.heading,
            });
          } catch (error) {
            console.error(
              "Canlı konum gönderilemedi:",
              error,
            );

            setEventError(
              error.message ||
                "Canlı konum gönderilemedi.",
            );
          }
        },
        (error) => {
          console.error("GPS takip hatası:", error);

          setEventError(
            "Canlı konum alınamadı. Tarayıcı konum iznini kontrol edin.",
          );

          setIsLiveTracking(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 3000,
        },
      );
  }

  useEffect(() => {
    return () => {
      if (
        watchIdRef.current !== null &&
        navigator.geolocation
      ) {
        navigator.geolocation.clearWatch(
          watchIdRef.current,
        );
      }
    };
  }, []);

  async function handleEvent(eventType, nextStep) {
    setIsSubmitting(true);
    setEventError("");

    try {
      let locationPayload = {};

      try {
        locationPayload = await getCurrentPosition();
      } catch (locationError) {
        const continueWithoutLocation = window.confirm(
          `${locationError.message}\n\nKonum olmadan devam edilsin mi?`,
        );

        if (!continueWithoutLocation) {
          return;
        }
      }

      await sendTransferEvent(
        transfer.id,
        eventType,
        locationPayload,
      );

      setTripStep(nextStep);
      setCurrentStatus(eventType);

      if (eventType === "on_the_way") {
        startLiveTracking();
      }

      if (
        eventType === "completed" ||
        eventType === "no_show"
      ) {
        stopLiveTracking();
      }
    } catch (error) {
      setEventError(
        error.message ||
          "Transfer durumu güncellenemedi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function callPassenger() {
    if (!transfer.passenger_phone) {
      alert("Yolcu telefon numarası bulunamadı.");
      return;
    }

    window.location.href =
      `tel:${transfer.passenger_phone}`;
  }

  function handleBack() {
    stopLiveTracking();
    onBack();
  }

  return (
    <main className="detail-page">
      <header className="detail-header">
        <button
          className="back-button"
          type="button"
          onClick={handleBack}
        >
          ←
        </button>

        <div>
          <p>TRANSFER DETAYI</p>
          <h1>{transfer.booking_reference}</h1>
        </div>

        <button
          className="call-button"
          type="button"
          onClick={callPassenger}
        >
          Ara
        </button>
      </header>

      <section className="detail-card">
        <div className="detail-status-row">
          <span
            className={`status-badge ${currentStatus}`}
          >
            {getStatusLabel(currentStatus)}
          </span>

          <strong>
            {formatTime(transfer.pickup_time)}
          </strong>
        </div>

        {isLiveTracking && (
          <div className="live-tracking-message">
            <span className="live-tracking-dot" />
            Canlı GPS takibi aktif
          </div>
        )}

        <TripTimeline currentStep={tripStep} />

        <div className="detail-route">
          <p>GÜZERGÂH</p>

          <h2>
            {transfer.pickup} → {transfer.dropoff}
          </h2>
        </div>

        <div className="detail-grid">
          <div>
            <span>Yolcu</span>

            <strong>
              {transfer.passenger_name ||
                "Yolcu belirtilmedi"}
            </strong>
          </div>

          <div>
            <span>Uçuş</span>

            <strong>
              {transfer.flight_number ||
                "Belirtilmedi"}
            </strong>
          </div>

          <div>
            <span>Araç</span>

            <strong>
              {transfer.vehicle_type ||
                "Araç belirtilmedi"}
            </strong>
          </div>

          <div>
            <span>Yolcu / Bagaj</span>

            <strong>
              {getPassengerCount(transfer)} Yolcu /{" "}
              {Number(
                transfer.luggage_count || 0,
              )}{" "}
              Bagaj
            </strong>
          </div>
        </div>

        <div className="address-block">
          <span>Alış Noktası</span>
          <strong>{transfer.pickup}</strong>

          <small>
            {transfer.meet_point ||
              "Buluşma noktası belirtilmedi"}
          </small>
        </div>

        <div className="address-block">
          <span>Bırakış Noktası</span>
          <strong>{transfer.dropoff}</strong>

          <small>
            {transfer.passenger_note ||
              "Ek yolcu notu bulunmuyor"}
          </small>
        </div>

        {eventError && (
          <div className="dashboard-error">
            {eventError}
          </div>
        )}

        <div className="action-grid">
          <button
            type="button"
            disabled={
              tripStep !== 0 || isSubmitting
            }
            onClick={() =>
              handleEvent("accepted", 1)
            }
          >
            {isSubmitting && tripStep === 0
              ? "Konum alınıyor..."
              : "Transferi Kabul Et"}
          </button>

          <button
            type="button"
            disabled={
              tripStep !== 1 || isSubmitting
            }
            onClick={() =>
              handleEvent("on_the_way", 2)
            }
          >
            {isSubmitting && tripStep === 1
              ? "Konum alınıyor..."
              : "Yola Çıktım"}
          </button>

          <button
            type="button"
            disabled={
              tripStep !== 2 || isSubmitting
            }
            onClick={() =>
              handleEvent("arrived", 3)
            }
          >
            {isSubmitting && tripStep === 2
              ? "Konum alınıyor..."
              : "Alış Noktasındayım"}
          </button>

          <button
            type="button"
            disabled={
              tripStep !== 3 || isSubmitting
            }
            onClick={() =>
              handleEvent("passenger_called", 4)
            }
          >
            {isSubmitting && tripStep === 3
              ? "Konum alınıyor..."
              : "Yolcuyu Aradım"}
          </button>

          <button
            type="button"
            disabled={
              tripStep !== 4 || isSubmitting
            }
            onClick={() =>
              handleEvent(
                "passenger_on_board",
                5,
              )
            }
          >
            {isSubmitting && tripStep === 4
              ? "Konum alınıyor..."
              : "Yolcu Geldi"}
          </button>

          <button
            type="button"
            disabled={
              tripStep !== 5 || isSubmitting
            }
            onClick={() =>
              handleEvent("trip_started", 6)
            }
          >
            {isSubmitting && tripStep === 5
              ? "Konum alınıyor..."
              : "Yolculuğu Başlat"}
          </button>

          <button
            className="danger"
            type="button"
            disabled={
              tripStep < 2 ||
              tripStep > 4 ||
              isSubmitting
            }
            onClick={() =>
              handleEvent("no_show", 7)
            }
          >
            {isSubmitting &&
            tripStep >= 2 &&
            tripStep <= 4
              ? "Konum alınıyor..."
              : "No Show"}
          </button>

          <button
            className="complete"
            type="button"
            disabled={
              tripStep !== 6 || isSubmitting
            }
            onClick={() =>
              handleEvent("completed", 7)
            }
          >
            {isSubmitting && tripStep === 6
              ? "Konum alınıyor..."
              : "Yolculuğu Tamamla"}
          </button>
        </div>
      </section>
    </main>
  );
}

function formatTime(dateTime) {
  if (!dateTime) {
    return "--:--";
  }

  return new Date(dateTime).toLocaleTimeString(
    "tr-TR",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function getPassengerCount(transfer) {
  return (
    Number(transfer.adult || 0) +
    Number(transfer.child || 0) +
    Number(transfer.baby || 0)
  );
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

function getStepFromStatus(status) {
  const steps = {
    pending: 0,
    accepted: 1,
    on_the_way: 2,
    arrived: 3,
    passenger_called: 4,
    passenger_on_board: 5,
    trip_started: 6,
    completed: 7,
    no_show: 7,
  };

  return steps[status] ?? 0;
}
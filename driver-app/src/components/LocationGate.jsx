import {
  useEffect,
  useState,
} from "react";

export default function LocationGate({
  children,
}) {
  const [checking, setChecking] =
    useState(true);

  const [permission, setPermission] =
    useState("unknown");

  const [locationReady, setLocationReady] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    checkPermission();
  }, []);

  async function checkPermission() {
    setChecking(true);
    setError("");

    try {
      if (!navigator.geolocation) {
        setPermission("unsupported");
        setLocationReady(false);
        return;
      }

      if (navigator.permissions?.query) {
        const result =
          await navigator.permissions.query({
            name: "geolocation",
          });

        setPermission(result.state);

        result.onchange = () => {
          setPermission(result.state);

          if (
            result.state !== "granted"
          ) {
            setLocationReady(false);
          }
        };

        if (result.state === "granted") {
          await requestCurrentLocation();
        }
      } else {
        setPermission("prompt");
      }
    } catch {
      setPermission("unknown");
    } finally {
      setChecking(false);
    }
  }

  function requestCurrentLocation() {
    return new Promise((resolve) => {
      setError("");

      navigator.geolocation.getCurrentPosition(
        () => {
          setPermission("granted");
          setLocationReady(true);
          resolve(true);
        },

        (positionError) => {
          setLocationReady(false);

          if (
            positionError.code ===
            positionError.PERMISSION_DENIED
          ) {
            setPermission("denied");
          }

          setError(
            getLocationErrorMessage(
              positionError,
            ),
          );

          resolve(false);
        },

        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000,
        },
      );
    });
  }

  if (checking) {
    return (
      <main className="location-gate-page">
        <section className="location-gate-card">
          <div className="location-gate-icon">
            📍
          </div>

          <h1>Konum kontrol ediliyor</h1>

          <p>
            Operasyona devam edebilmeniz için
            konum servisleri doğrulanıyor.
          </p>
        </section>
      </main>
    );
  }

  if (
    permission === "granted" &&
    locationReady
  ) {
    return children;
  }

  return (
    <main className="location-gate-page">
      <section className="location-gate-card">
        <div className="location-gate-icon">
          📍
        </div>

        <p className="location-gate-eyebrow">
          SKYFLEET AI
        </p>

        <h1>Konum servisi gerekli</h1>

        <p>
          Transfer detaylarını görüntülemek ve
          operasyona başlamak için cihazınızın
          konum servisini açmanız gerekir.
        </p>

        <div className="location-gate-reasons">
          <div>
            <span>✓</span>
            Canlı araç takibi
          </div>

          <div>
            <span>✓</span>
            Pickup varış doğrulaması
          </div>

          <div>
            <span>✓</span>
            Operasyon güvenliği
          </div>

          <div>
            <span>✓</span>
            GPS ve zaman kanıtı
          </div>
        </div>

        {permission === "denied" && (
          <div className="location-gate-warning">
            Konum izni reddedilmiş. Tarayıcı
            ayarlarından bu site için konum
            iznini etkinleştirin.
          </div>
        )}

        {permission === "unsupported" && (
          <div className="location-gate-warning">
            Bu cihaz veya tarayıcı konum
            servislerini desteklemiyor.
          </div>
        )}

        {error && (
          <div className="location-gate-warning">
            {error}
          </div>
        )}

        <button
          type="button"
          disabled={
            permission === "unsupported"
          }
          onClick={requestCurrentLocation}
        >
          Konum Servisini Aç
        </button>

        <button
          className="location-gate-recheck"
          type="button"
          onClick={checkPermission}
        >
          İzni Tekrar Kontrol Et
        </button>
      </section>
    </main>
  );
}

function getLocationErrorMessage(
  error,
) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Konum izni verilmedi.";

    case error.POSITION_UNAVAILABLE:
      return "Cihaz konumu belirlenemedi. GPS servisinin açık olduğundan emin olun.";

    case error.TIMEOUT:
      return "Konum alınırken zaman aşımı oluştu.";

    default:
      return "Konum servisi doğrulanamadı.";
  }
}
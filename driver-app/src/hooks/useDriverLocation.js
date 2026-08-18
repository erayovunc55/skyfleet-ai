import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import driverLocationService from "../services/driverLocationService";

const DEFAULT_SEND_INTERVAL = 5000;
const HEARTBEAT_INTERVAL = 10000;

export default function useDriverLocation({
  transferId,
  enabled = false,
  sendInterval = DEFAULT_SEND_INTERVAL,
}) {
  const [location, setLocation] = useState(null);
  const [permissionState, setPermissionState] = useState("unknown");
  const [tracking, setTracking] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [lastSentAt, setLastSentAt] = useState(null);

  const watchIdRef = useRef(null);
  const heartbeatIdRef = useRef(null);
  const latestLocationRef = useRef(null);
  const lastSendTimeRef = useRef(0);
  const sendingRef = useRef(false);
  const mountedRef = useRef(true);

  const sendLocation = useCallback(
    async (currentLocation, force = false) => {
      if (!transferId || !currentLocation) return;

      const latitude = Number(currentLocation.latitude);
      const longitude = Number(currentLocation.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

      const now = Date.now();
      const elapsed = now - lastSendTimeRef.current;

      if (!force && elapsed < sendInterval) return;
      if (sendingRef.current) return;

      sendingRef.current = true;
      if (mountedRef.current) {
        setSending(true);
        setError("");
      }

      // When the vehicle is stationary, watchPosition may not emit a new event.
      // Always stamp the server heartbeat with the current time so "last seen"
      // remains live even if latitude/longitude have not changed.
      const payload = {
        ...currentLocation,
        latitude,
        longitude,
        recordedAt: new Date().toISOString(),
      };

      try {
        await driverLocationService.sendLocation(transferId, payload);
        lastSendTimeRef.current = now;

        if (mountedRef.current) {
          setLastSentAt(payload.recordedAt);
        }
      } catch (requestError) {
        if (mountedRef.current) {
          setError(
            requestError?.response?.data?.message ||
              requestError?.message ||
              "Konum sunucuya gönderilemedi.",
          );
        }
      } finally {
        sendingRef.current = false;
        if (mountedRef.current) setSending(false);
      }
    },
    [sendInterval, transferId],
  );

  const saveLocation = useCallback(
    async (position, force = false) => {
      const nextLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed,
        heading: position.coords.heading,
        recordedAt: new Date(position.timestamp || Date.now()).toISOString(),
      };

      latestLocationRef.current = nextLocation;

      try {
        sessionStorage.setItem(
          "skyfleet_driver_last_location",
          JSON.stringify(nextLocation),
        );
      } catch {
        // Location sharing continues even when browser storage is unavailable.
      }

      if (mountedRef.current) {
        setLocation(nextLocation);
        setPermissionState("granted");
      }

      await sendLocation(nextLocation, force);
    },
    [sendLocation],
  );

  const requestFreshLocation = useCallback(
    (force = true) => {
      if (!navigator.geolocation || !transferId) return;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          saveLocation(position, force);
        },
        (positionError) => {
          if (!mountedRef.current) return;

          if (positionError.code === positionError.PERMISSION_DENIED) {
            setPermissionState("denied");
          }

          // Keep the previous valid coordinate alive if the browser cannot
          // produce a fresh fix during a temporary GPS timeout.
          if (latestLocationRef.current) {
            sendLocation(latestLocationRef.current, true);
            return;
          }

          setError(getLocationErrorMessage(positionError));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 3000,
        },
      );
    },
    [saveLocation, sendLocation, transferId],
  );

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIdRef.current !== null) {
      window.clearInterval(heartbeatIdRef.current);
      heartbeatIdRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();

    heartbeatIdRef.current = window.setInterval(() => {
      if (!enabled || !transferId || !latestLocationRef.current) return;
      sendLocation(latestLocationRef.current, true);
    }, HEARTBEAT_INTERVAL);
  }, [enabled, sendLocation, stopHeartbeat, transferId]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = null;
    stopHeartbeat();
    setTracking(false);
  }, [stopHeartbeat]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setPermissionState("unsupported");
      setError("Bu cihaz konum hizmetlerini desteklemiyor.");
      return;
    }

    if (!transferId) {
      setError("Aktif transfer bulunamadı.");
      return;
    }

    if (watchIdRef.current !== null) return;

    setError("");
    setTracking(true);

    // Do not wait for movement before publishing the first live coordinate.
    requestFreshLocation(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        saveLocation(position, false);
      },
      (positionError) => {
        if (!mountedRef.current) return;

        if (positionError.code === positionError.PERMISSION_DENIED) {
          setPermissionState("denied");
          setTracking(false);
          stopHeartbeat();
          return;
        }

        // A watch timeout must not kill an otherwise working live session.
        // Heartbeats continue using the latest valid fix.
        if (!latestLocationRef.current) {
          setError(getLocationErrorMessage(positionError));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 3000,
      },
    );

    startHeartbeat();
  }, [
    requestFreshLocation,
    saveLocation,
    startHeartbeat,
    stopHeartbeat,
    transferId,
  ]);

  const sendNow = useCallback(async () => {
    if (!latestLocationRef.current) {
      requestFreshLocation(true);
      return;
    }

    await sendLocation(latestLocationRef.current, true);
  }, [requestFreshLocation, sendLocation]);

  useEffect(() => {
    mountedRef.current = true;

    try {
      const stored = JSON.parse(
        sessionStorage.getItem("skyfleet_driver_last_location") || "null",
      );

      if (
        stored &&
        Number.isFinite(Number(stored.latitude)) &&
        Number.isFinite(Number(stored.longitude))
      ) {
        latestLocationRef.current = stored;
        setLocation(stored);
      }
    } catch {
      // Ignore invalid cached location.
    }

    return () => {
      mountedRef.current = false;

      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      stopHeartbeat();
    };
  }, [stopHeartbeat]);

  useEffect(() => {
    if (enabled && transferId) {
      startTracking();
    } else {
      stopTracking();
    }

    return stopTracking;
  }, [enabled, startTracking, stopTracking, transferId]);

  useEffect(() => {
    if (!enabled || !transferId) return undefined;

    const refreshWhenActive = () => {
      if (document.visibilityState === "visible") {
        requestFreshLocation(true);
      }
    };

    const refreshWhenOnline = () => {
      requestFreshLocation(true);
    };

    document.addEventListener("visibilitychange", refreshWhenActive);
    window.addEventListener("focus", refreshWhenActive);
    window.addEventListener("online", refreshWhenOnline);

    return () => {
      document.removeEventListener("visibilitychange", refreshWhenActive);
      window.removeEventListener("focus", refreshWhenActive);
      window.removeEventListener("online", refreshWhenOnline);
    };
  }, [enabled, requestFreshLocation, transferId]);

  return {
    location,
    permissionState,
    tracking,
    sending,
    error,
    lastSentAt,
    startTracking,
    stopTracking,
    sendNow,
  };
}

function getLocationErrorMessage(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Konum izni reddedildi.";
    case error.POSITION_UNAVAILABLE:
      return "Cihaz konumu belirlenemedi.";
    case error.TIMEOUT:
      return "Konum alınırken zaman aşımı oluştu.";
    default:
      return "Konum alınırken bilinmeyen bir hata oluştu.";
  }
}

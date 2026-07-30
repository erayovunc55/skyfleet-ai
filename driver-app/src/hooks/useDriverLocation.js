import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import driverLocationService from "../services/driverLocationService";

const DEFAULT_SEND_INTERVAL = 10000;

export default function useDriverLocation({
  transferId,
  enabled = false,
  sendInterval =
    DEFAULT_SEND_INTERVAL,
}) {
  const [location, setLocation] =
    useState(null);

  const [
    permissionState,
    setPermissionState,
  ] = useState("unknown");

  const [tracking, setTracking] =
    useState(false);

  const [sending, setSending] =
    useState(false);

  const [error, setError] =
    useState("");

  const [lastSentAt, setLastSentAt] =
    useState(null);

  const watchIdRef = useRef(null);
  const latestLocationRef =
    useRef(null);

  const lastSendTimeRef =
    useRef(0);

  const mountedRef = useRef(true);

  const sendLocation = useCallback(
    async (
      currentLocation,
      force = false,
    ) => {
      if (
        !transferId ||
        !currentLocation
      ) {
        return;
      }

      const now = Date.now();
      const elapsed =
        now -
        lastSendTimeRef.current;

      if (
        !force &&
        elapsed < sendInterval
      ) {
        return;
      }

      setSending(true);
      setError("");

      try {
        await driverLocationService
          .sendLocation(
            transferId,
            currentLocation,
          );

        lastSendTimeRef.current = now;

        if (mountedRef.current) {
          setLastSentAt(
            new Date().toISOString(),
          );
        }
      } catch (requestError) {
        if (mountedRef.current) {
          setError(
            requestError?.response
              ?.data?.message ||
              requestError?.message ||
              "Konum sunucuya gönderilemedi.",
          );
        }
      } finally {
        if (mountedRef.current) {
          setSending(false);
        }
      }
    },
    [
      sendInterval,
      transferId,
    ],
  );

  const stopTracking =
    useCallback(() => {
      if (
        watchIdRef.current !== null &&
        navigator.geolocation
      ) {
        navigator.geolocation
          .clearWatch(
            watchIdRef.current,
          );
      }

      watchIdRef.current = null;
      setTracking(false);
    }, []);

  const startTracking =
    useCallback(() => {
      if (!navigator.geolocation) {
        setError(
          "Bu cihaz konum hizmetlerini desteklemiyor.",
        );

        return;
      }

      if (!transferId) {
        setError(
          "Aktif transfer bulunamadı.",
        );

        return;
      }

      if (
        watchIdRef.current !== null
      ) {
        return;
      }

      setError("");
      setTracking(true);

      watchIdRef.current =
        navigator.geolocation
          .watchPosition(
            async (position) => {
              const nextLocation = {
                latitude:
                  position.coords
                    .latitude,

                longitude:
                  position.coords
                    .longitude,

                accuracy:
                  position.coords
                    .accuracy,

                speed:
                  position.coords
                    .speed,

                heading:
                  position.coords
                    .heading,

                recordedAt:
                  new Date(
                    position.timestamp,
                  ).toISOString(),
              };

              latestLocationRef.current =
                nextLocation;

              if (
                mountedRef.current
              ) {
                setLocation(
                  nextLocation,
                );

                setPermissionState(
                  "granted",
                );
              }

              await sendLocation(
                nextLocation,
              );
            },

            (positionError) => {
              if (
                !mountedRef.current
              ) {
                return;
              }

              if (
                positionError.code ===
                positionError
                  .PERMISSION_DENIED
              ) {
                setPermissionState(
                  "denied",
                );
              }

              setError(
                getLocationErrorMessage(
                  positionError,
                ),
              );

              setTracking(false);
              watchIdRef.current = null;
            },

            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 5000,
            },
          );
    }, [
      sendLocation,
      transferId,
    ]);

  const sendNow = useCallback(
    async () => {
      if (
        !latestLocationRef.current
      ) {
        setError(
          "Henüz gönderilecek konum alınmadı.",
        );

        return;
      }

      await sendLocation(
        latestLocationRef.current,
        true,
      );
    },
    [sendLocation],
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (
        watchIdRef.current !== null &&
        navigator.geolocation
      ) {
        navigator.geolocation
          .clearWatch(
            watchIdRef.current,
          );
      }
    };
  }, []);

  useEffect(() => {
    if (
      enabled &&
      transferId
    ) {
      startTracking();
    } else {
      stopTracking();
    }

    return stopTracking;
  }, [
    enabled,
    startTracking,
    stopTracking,
    transferId,
  ]);

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

function getLocationErrorMessage(
  error,
) {
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
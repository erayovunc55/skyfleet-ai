import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import transferService from "../services/transferService";

const DEFAULT_INTERVAL = 10000;

export default function useLiveTransfer({
  transferId,
  enabled = true,
  interval = DEFAULT_INTERVAL,
  onUpdate,
}) {
  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [lastUpdatedAt, setLastUpdatedAt] =
    useState(null);

  const mountedRef = useRef(true);
  const requestRunningRef = useRef(false);

  const refresh = useCallback(async () => {
    if (
      !transferId ||
      requestRunningRef.current
    ) {
      return;
    }

    requestRunningRef.current = true;

    if (mountedRef.current) {
      setRefreshing(true);
      setError("");
    }

    try {
      const transfer =
        await transferService.getTransfer(
          transferId,
        );

      if (mountedRef.current) {
        onUpdate?.(transfer);

        setLastUpdatedAt(
          new Date().toISOString(),
        );
      }
    } catch (requestError) {
      if (mountedRef.current) {
        setError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            "Canlı transfer bilgisi yenilenemedi.",
        );
      }
    } finally {
      requestRunningRef.current = false;

      if (mountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [onUpdate, transferId]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !transferId) {
      return undefined;
    }

    refresh();

    const timerId = window.setInterval(
      refresh,
      interval,
    );

    return () => {
      window.clearInterval(timerId);
    };
  }, [
    enabled,
    interval,
    refresh,
    transferId,
  ]);

  return {
    refreshing,
    error,
    lastUpdatedAt,
    refresh,
  };
}
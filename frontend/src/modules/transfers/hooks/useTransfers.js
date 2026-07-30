import {
  useCallback,
  useEffect,
  useState,
} from "react";

import transferService from "../services/transferService";

export default function useTransfers() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTransfers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response =
        await transferService.getDispatcherTransfers();

      const items = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

      setTransfers(items);
    } catch (requestError) {
      console.error(
        "Transfer listesi yüklenemedi:",
        requestError,
      );

      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Transfer listesi yüklenemedi.",
      );

      setTransfers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  return {
    transfers,
    loading,
    error,
    reload: loadTransfers,
  };
}

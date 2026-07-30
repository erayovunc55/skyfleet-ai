import { useCallback, useEffect, useState } from "react";
import supplierService from "../services/supplierService";

export default function useSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await supplierService.getSuppliers();

      setSuppliers(response.data || []);
    } catch (err) {
      console.error(err);
      setError("Tedarikçiler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  return {
    suppliers,
    loading,
    error,
    reload: loadSuppliers,
  };
}
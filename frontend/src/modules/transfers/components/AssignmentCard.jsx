import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../../i18n";
import apiClient from "../../../services/apiClient";
import useTransfer from "../hooks/useTransfer";
import "./assignment-compact.css";

const I18N = {
  tr: { heading: "Hızlı Atama", supplier: "Tedarikçi", driver: "Sürücü / Araç", none: "Seçilmedi", chooseSupplier: "Tedarikçi seçin", chooseDriver: "Sürücü seçin", noVehicle: "Araç yok", vehicle: "Araç", pool: "İş havuzu", private: "Manuel atama", published: "Havuzda", publish: "Havuza gönder", retract: "Havuzdan çek", save: "Değişiklikleri Kaydet", saved: "Atama güncellendi.", unchanged: "Değişiklik yok", loading: "Yükleniyor...", removeDriver: "Sürücü atamasını kaldır", error: "Atama kaydedilemedi.", poolError: "İş havuzu işlemi başarısız.", poolHint: "Havuza gönderme ayrı bir işlemdir.", locked: "Havuzdayken tedarikçi değiştirilemez.", pending: "Havuz yalnızca bekleyen ve tedarikçisi olmayan işlerde kullanılabilir.", removing: "Atamayı kaldır", assign: "Atamayı kaydet" },
  en: { heading: "Quick Dispatch", supplier: "Supplier", driver: "Driver / Vehicle", none: "Not selected", chooseSupplier: "Select supplier", chooseDriver: "Select driver", noVehicle: "No vehicle", vehicle: "Vehicle", pool: "Job pool", private: "Manual assignment", published: "In pool", publish: "Publish to pool", retract: "Retract from pool", save: "Save Changes", saved: "Assignment updated.", unchanged: "No changes", loading: "Loading...", removeDriver: "Remove driver assignment", error: "Assignment could not be saved.", poolError: "Job pool operation failed.", poolHint: "Publishing to the pool is a separate action.", locked: "Supplier cannot be changed while published.", pending: "Only pending jobs without a supplier can be published.", removing: "Remove assignment", assign: "Save assignment" },
};

export default function AssignmentCard() {
  const { language } = useLanguage();
  const t = I18N[language] || I18N.en;
  const { selectedTransfer, updateSelectedTransfer } = useTransfer();
  const [drivers, setDrivers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [driverId, setDriverId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [poolBusy, setPoolBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const transferId = selectedTransfer?.id;
  const savedDriverId = selectedTransfer?.driver?.id ? String(selectedTransfer.driver.id) : "";
  const savedSupplierId = selectedTransfer?.supplier_id ? String(selectedTransfer.supplier_id) : "";
  const poolPublished = Boolean(selectedTransfer?.job_pool_published_at);
  const supplierChanged = supplierId !== savedSupplierId;
  const driverChanged = driverId !== savedDriverId;
  const selectedDriver = useMemo(() => drivers.find((item) => String(item.id) === driverId) || null, [drivers, driverId]);

  useEffect(() => {
    setDriverId(savedDriverId);
    setSupplierId(savedSupplierId);
    setError("");
    setMessage("");
  }, [transferId, savedDriverId, savedSupplierId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [driverResult, supplierResult] = await Promise.allSettled([
          apiClient.get("/drivers"),
          apiClient.get("/suppliers", { params: { status: "approved", is_active: 1, per_page: 100 } }),
        ]);
        if (cancelled) return;
        if (driverResult.status === "fulfilled") setDrivers(Array.isArray(driverResult.value.data?.data) ? driverResult.value.data.data : []);
        if (supplierResult.status === "fulfilled") setSuppliers(Array.isArray(supplierResult.value.data?.data) ? supplierResult.value.data.data : []);
        if (driverResult.status === "rejected" || supplierResult.status === "rejected") setError(t.error);
      } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [t.error]);

  if (!selectedTransfer) return null;

  async function saveAssignment() {
    if (saving || poolBusy || (!supplierChanged && !driverChanged) || (poolPublished && supplierChanged)) return;
    setSaving(true); setError(""); setMessage("");
    let current = selectedTransfer;
    try {
      // Keep the original backend contracts: supplier and driver are separate PATCH operations.
      // Do not publish to the job pool as a side effect of saving.
      if (supplierChanged) {
        const response = await apiClient.patch(`/dispatcher/transfers/${transferId}/supplier`, { supplier_id: supplierId ? Number(supplierId) : null });
        current = { ...current, ...(response.data?.data || {}), supplier_id: supplierId ? Number(supplierId) : null };
        updateSelectedTransfer(current);
      }
      if (driverChanged) {
        const response = await apiClient.patch(`/transfers/${transferId}/assignment`, { driver_id: driverId ? Number(driverId) : null });
        current = { ...current, ...(response.data?.data || {}), driver: response.data?.data?.driver ?? selectedDriver ?? null };
        updateSelectedTransfer(current);
      }
      setMessage(t.saved);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || t.error);
    } finally { setSaving(false); }
  }

  async function togglePool() {
    if (saving || poolBusy || (!poolPublished && (Boolean(selectedTransfer.supplier_id) || selectedTransfer.status !== "pending"))) return;
    setPoolBusy(true); setError(""); setMessage("");
    try {
      const response = poolPublished
        ? await apiClient.delete(`/dispatcher/transfers/${transferId}/job-pool`)
        : await apiClient.post(`/dispatcher/transfers/${transferId}/job-pool`);
      updateSelectedTransfer({ ...selectedTransfer, ...(response.data?.data || {}) });
      setMessage(response.data?.message || t.saved);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || t.poolError);
    } finally { setPoolBusy(false); }
  }

  const canTogglePool = poolPublished || (!selectedTransfer.supplier_id && selectedTransfer.status === "pending");
  const vehicle = selectedDriver?.vehicle || selectedTransfer.driver?.vehicle;
  return (
    <section className="sf-quick-dispatch" aria-label={t.heading}>
      <header className="sf-qd-head"><strong>{t.heading}</strong><span>{selectedTransfer.reference || selectedTransfer.booking_reference || `#${transferId}`}</span></header>
      <div className="sf-qd-fields">
        <label className="sf-qd-field"><span>{t.supplier}</span>
          <select value={supplierId} disabled={loading || saving || poolBusy || poolPublished} onChange={(e) => { setSupplierId(e.target.value); setMessage(""); }}>
            <option value="">{t.chooseSupplier}</option>
            {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.company_name} — {supplier.city || supplier.country_code || ""}</option>)}
          </select>
        </label>
        <label className="sf-qd-field"><span>{t.driver}</span>
          <select value={driverId} disabled={loading || saving || poolBusy} onChange={(e) => { setDriverId(e.target.value); setMessage(""); }}>
            <option value="">{savedDriverId ? t.removeDriver : t.chooseDriver}</option>
            {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name} — {driver.vehicle?.plate || t.noVehicle}</option>)}
          </select>
        </label>
      </div>
      <div className="sf-qd-vehicle"><span>{t.vehicle}</span><strong>{vehicle ? `${vehicle.brand || ""} ${vehicle.model || ""} · ${vehicle.plate || ""}` : t.none}</strong></div>
      {poolPublished && <small className="sf-qd-note">{t.locked}</small>}
      {error && <div className="sf-qd-message sf-qd-error" role="alert">{error}</div>}
      {message && <div className="sf-qd-message sf-qd-success" role="status">{message}</div>}
      <button className="sf-qd-save" type="button" disabled={loading || saving || poolBusy || (!supplierChanged && !driverChanged) || (poolPublished && supplierChanged)} onClick={saveAssignment}>
        {saving ? t.loading : (supplierChanged || driverChanged) ? t.save : t.unchanged}
      </button>
      <div className="sf-qd-pool"><div><strong>{t.pool}</strong><span>{poolPublished ? t.published : t.private}</span></div>
        <button type="button" disabled={!canTogglePool || poolBusy || saving || supplierChanged || driverChanged} onClick={togglePool}>{poolBusy ? t.loading : poolPublished ? t.retract : t.publish}</button>
      </div>
      <small className="sf-qd-note">{t.poolHint}</small>
    </section>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Button, Card, StatusBadge } from "../../../components/ui";
import { useLanguage } from "../../../i18n";
import apiClient from "../../../services/apiClient";
import useTransfer from "../hooks/useTransfer";

const TEXT = {
  tr: {
    title: "Operasyon Ataması", subtitle: "Tedarikçi, sürücü ve araç yönetimi", supplier: "Tedarikçi", selectSupplier: "Manuel tedarikçi seçin", noSupplier: "Atama yok", assignSupplier: "Tedarikçiyi Ata", removeSupplier: "Tedarikçi Atamasını Kaldır", supplierSuccess: "Tedarikçi ataması güncellendi.", supplierError: "Tedarikçi ataması kaydedilemedi.", pool: "İş Havuzu", publishPool: "İş Havuzuna Gönder", retractPool: "Havuzdan Geri Çek", poolPublished: "Havuzda", poolPrivate: "Manuel Atama Bekliyor", poolInfo: "Transfer önce manuel olarak atanabilir. Havuza yalnızca siz gönderirseniz tedarikçilere açılır.",
    driver: "Sürücü", loading: "Sürücüler yükleniyor...", selectDriver: "Sürücü seçin", removeDriver: "Sürücü atamasını kaldır", noVehicle: "Araç yok", assignedVehicle: "Atanacak araç", save: "Atamayı Kaydet", assign: "Sürücü Ata", remove: "Atamayı Kaldır", listError: "Sürücü listesi alınamadı.", success: "Atama başarıyla güncellendi.", saveError: "Atama kaydedilemedi.",
  },
  en: {
    title: "Operation Assignment", subtitle: "Supplier, driver & vehicle management", supplier: "Supplier", selectSupplier: "Select supplier manually", noSupplier: "No assignment", assignSupplier: "Assign Supplier", removeSupplier: "Remove Supplier Assignment", supplierSuccess: "Supplier assignment updated.", supplierError: "Supplier assignment could not be saved.", pool: "Job Pool", publishPool: "Publish to Job Pool", retractPool: "Retract from Pool", poolPublished: "Published", poolPrivate: "Awaiting Manual Assignment", poolInfo: "You can assign the transfer manually first. Suppliers see it only after you explicitly publish it to the pool.",
    driver: "Driver", loading: "Loading drivers...", selectDriver: "Select driver", removeDriver: "Remove driver assignment", noVehicle: "No vehicle", assignedVehicle: "Vehicle to be assigned", save: "Save Assignment", assign: "Assign Driver", remove: "Remove Assignment", listError: "Driver list could not be loaded.", success: "Assignment updated successfully.", saveError: "Assignment could not be saved.",
  },
};

export default function AssignmentCard() {
  const { language } = useLanguage();
  const text = TEXT[language] || TEXT.en;
  const { selectedTransfer, updateSelectedTransfer } = useTransfer();

  const [drivers, setDrivers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [driverId, setDriverId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [savingPool, setSavingPool] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setDriverId(selectedTransfer?.driver?.id ? String(selectedTransfer.driver.id) : "");
    setSupplierId(selectedTransfer?.supplier_id ? String(selectedTransfer.supplier_id) : "");
  }, [selectedTransfer]);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoadingDrivers(true); setLoadingSuppliers(true); setError("");
      try {
        const [driversResponse, suppliersResponse] = await Promise.all([
          apiClient.get("/drivers"),
          apiClient.get("/suppliers", { params: { status: "approved", is_active: 1, per_page: 100 } }),
        ]);
        if (!cancelled) {
          setDrivers(Array.isArray(driversResponse.data?.data) ? driversResponse.data.data : []);
          setSuppliers(Array.isArray(suppliersResponse.data?.data) ? suppliersResponse.data.data : []);
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError?.response?.data?.message || text.listError);
      } finally {
        if (!cancelled) { setLoadingDrivers(false); setLoadingSuppliers(false); }
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [text.listError]);

  const selectedDriver = useMemo(() => drivers.find((driver) => Number(driver.id) === Number(driverId)) || null, [drivers, driverId]);

  if (!selectedTransfer) return null;

  const hasAssignedDriver = Boolean(selectedTransfer.driver?.id);
  const isRemovingAssignment = hasAssignedDriver && !driverId;
  const isEmptyUnassignedState = !hasAssignedDriver && !driverId;
  const poolPublished = Boolean(selectedTransfer.job_pool_published_at);
  const hasSupplier = Boolean(selectedTransfer.supplier_id);

  async function handleSupplierSave() {
    setSavingSupplier(true); setError(""); setMessage("");
    try {
      const response = await apiClient.patch(`/dispatcher/transfers/${selectedTransfer.id}/supplier`, {
        supplier_id: supplierId ? Number(supplierId) : null,
      });
      const updated = response.data?.data || {};
      updateSelectedTransfer({ ...selectedTransfer, ...updated });
      setMessage(response.data?.message || text.supplierSuccess);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || text.supplierError);
    } finally { setSavingSupplier(false); }
  }

  async function handlePoolToggle() {
    setSavingPool(true); setError(""); setMessage("");
    try {
      const response = poolPublished
        ? await apiClient.delete(`/dispatcher/transfers/${selectedTransfer.id}/job-pool`)
        : await apiClient.post(`/dispatcher/transfers/${selectedTransfer.id}/job-pool`);
      const updated = response.data?.data || {};
      updateSelectedTransfer({ ...selectedTransfer, ...updated });
      setMessage(response.data?.message || "OK");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || text.supplierError);
    } finally { setSavingPool(false); }
  }

  async function handleSave() {
    if (isEmptyUnassignedState) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await apiClient.patch(`/transfers/${selectedTransfer.id}/assignment`, { driver_id: driverId ? Number(driverId) : null });
      const updatedTransfer = response.data?.data || {};
      updateSelectedTransfer({ ...updatedTransfer, driver: updatedTransfer.driver || selectedDriver || null });
      setMessage(response.data?.message || text.success);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || text.saveError);
    } finally { setSaving(false); }
  }

  const emptyOptionLabel = loadingDrivers ? text.loading : hasAssignedDriver ? text.removeDriver : text.selectDriver;
  const actionLabel = isRemovingAssignment ? text.remove : hasAssignedDriver ? text.save : text.assign;

  return (
    <Card title={text.title} subtitle={text.subtitle} actions={hasAssignedDriver ? <StatusBadge status={selectedTransfer.operation_summary?.driver_status || "active"} /> : null}>
      <div className="assignment-field">
        <label>{text.supplier}</label>
        <select value={supplierId} disabled={loadingSuppliers || savingSupplier || poolPublished} onChange={(e) => { setSupplierId(e.target.value); setError(""); setMessage(""); }}>
          <option value="">{hasSupplier ? text.removeSupplier : text.selectSupplier}</option>
          {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.company_name} — {supplier.city || supplier.country_code}</option>)}
        </select>
      </div>

      <Button variant="primary" loading={savingSupplier} disabled={loadingSuppliers || poolPublished || (!supplierId && !hasSupplier)} onClick={handleSupplierSave}>
        {hasSupplier && !supplierId ? text.removeSupplier : text.assignSupplier}
      </Button>

      <div className="assignment-vehicle-preview">
        <span>{text.pool}</span>
        <strong>{poolPublished ? text.poolPublished : text.poolPrivate}</strong>
        <small>{text.poolInfo}</small>
      </div>

      <Button variant={poolPublished ? "danger" : "primary"} loading={savingPool} disabled={hasSupplier || selectedTransfer.status !== "pending"} onClick={handlePoolToggle}>
        {poolPublished ? text.retractPool : text.publishPool}
      </Button>

      <div className="assignment-field">
        <label htmlFor="assignment-driver">{text.driver}</label>
        <select id="assignment-driver" value={driverId} disabled={loadingDrivers || saving} onChange={(event) => { setDriverId(event.target.value); setError(""); setMessage(""); }}>
          <option value="">{emptyOptionLabel}</option>
          {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}{driver.vehicle ? ` — ${driver.vehicle.plate}` : ` — ${text.noVehicle}`}</option>)}
        </select>
      </div>

      {selectedDriver?.vehicle && <div className="assignment-vehicle-preview"><span>{text.assignedVehicle}</span><strong>{selectedDriver.vehicle.brand} {selectedDriver.vehicle.model}</strong><small>{selectedDriver.vehicle.plate}</small></div>}
      {error && <div className="assignment-message error">{error}</div>}
      {message && <div className="assignment-message success">{message}</div>}
      <Button variant={isRemovingAssignment ? "danger" : "primary"} loading={saving} disabled={isEmptyUnassignedState || loadingDrivers} onClick={handleSave}>{actionLabel}</Button>
    </Card>
  );
}

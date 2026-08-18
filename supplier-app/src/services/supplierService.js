import apiClient from "./apiClient";

export async function getSupplierProfile() {
  const response = await apiClient.get("/supplier-portal/profile");
  return response.data?.data || response.data;
}

export async function getSupplierTransfers(filters = {}) {
  const params = {};
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.dateFrom) params.date_from = filters.dateFrom;
  if (filters.dateTo) params.date_to = filters.dateTo;
  params.per_page = 100;

  const response = await apiClient.get("/supplier-portal/transfers", { params });
  return response.data;
}

export async function getSupplierTransfer(transferId) {
  if (!transferId) throw new Error("Transfer kimliği bulunamadı.");
  const response = await apiClient.get(`/supplier-portal/transfers/${transferId}`);
  return response.data?.data || response.data;
}

export async function getSupplierFinancials(filters = {}) {
  const params = {
    page: filters.page || 1,
    per_page: filters.perPage || 25,
  };
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.dateFrom) params.date_from = filters.dateFrom;
  if (filters.dateTo) params.date_to = filters.dateTo;

  const response = await apiClient.get("/supplier-portal/financials", { params });
  return response.data;
}

export async function getSupplierFinancial(financialId) {
  if (!financialId) throw new Error("Hakediş kaydı bulunamadı.");
  const response = await apiClient.get(`/supplier-portal/financials/${financialId}`);
  return response.data?.data || response.data;
}

export async function getSupplierInvoices(filters = {}) {
  const params = {
    page: filters.page || 1,
    per_page: filters.perPage || 25,
  };
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.dateFrom) params.date_from = filters.dateFrom;
  if (filters.dateTo) params.date_to = filters.dateTo;

  const response = await apiClient.get("/supplier-portal/invoices", { params });
  return response.data;
}

export async function createSupplierInvoice(payload) {
  if (!(payload instanceof FormData)) {
    throw new Error("Fatura verileri hazırlanamadı.");
  }
  const response = await apiClient.post("/supplier-portal/invoices", payload);
  return response.data;
}

export async function downloadSupplierInvoice(invoiceId, fileName = "fatura") {
  if (!invoiceId) throw new Error("Fatura kimliği bulunamadı.");
  const response = await apiClient.get(`/supplier-portal/invoices/${invoiceId}/download`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || "fatura";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function getSupplierVehicles() {
  const response = await apiClient.get("/supplier-portal/vehicles");
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function createSupplierVehicle(payload) {
  const response = await apiClient.post("/supplier-portal/vehicles", payload);
  return response.data?.data || response.data;
}

export async function updateSupplierVehicle(vehicleId, payload) {
  if (!vehicleId) throw new Error("Araç kimliği bulunamadı.");
  const response = await apiClient.patch(`/supplier-portal/vehicles/${vehicleId}`, payload);
  return response.data?.data || response.data;
}

export async function changeSupplierVehicleStatus(vehicleId, operationalStatus) {
  if (!vehicleId) throw new Error("Araç kimliği bulunamadı.");
  const response = await apiClient.patch(`/supplier-portal/vehicles/${vehicleId}/status`, {
    operational_status: operationalStatus,
  });
  return response.data?.data || response.data;
}

export async function deactivateSupplierVehicle(vehicleId) {
  if (!vehicleId) throw new Error("Araç kimliği bulunamadı.");
  const response = await apiClient.delete(`/supplier-portal/vehicles/${vehicleId}`);
  return response.data?.data || response.data;
}

export async function getSupplierDrivers() {
  const response = await apiClient.get("/supplier-portal/drivers");
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function createSupplierDriver(payload) {
  const response = await apiClient.post("/supplier-portal/drivers", payload);
  return response.data?.data || response.data;
}

export async function updateSupplierDriver(driverId, payload) {
  if (!driverId) throw new Error("Sürücü kimliği bulunamadı.");
  const response = await apiClient.patch(`/supplier-portal/drivers/${driverId}`, payload);
  return response.data?.data || response.data;
}

export async function assignSupplierVehicleToDriver(driverId, vehicleId) {
  if (!driverId) throw new Error("Sürücü kimliği bulunamadı.");
  const response = await apiClient.patch(`/supplier-portal/drivers/${driverId}/vehicle`, {
    vehicle_id: vehicleId || null,
  });
  return response.data?.data || response.data;
}

export async function deactivateSupplierDriver(driverId) {
  if (!driverId) throw new Error("Sürücü kimliği bulunamadı.");
  const response = await apiClient.delete(`/supplier-portal/drivers/${driverId}`);
  return response.data?.data || response.data;
}

export async function assignSupplierTransfer(transferId, driverId, vehicleId) {
  if (!transferId) throw new Error("Transfer kimliği bulunamadı.");
  if (!driverId) throw new Error("Sürücü seçmelisiniz.");
  if (!vehicleId) throw new Error("Araç seçmelisiniz.");

  const response = await apiClient.patch(
    `/supplier-portal/transfers/${transferId}/assignment`,
    { driver_id: Number(driverId), vehicle_id: Number(vehicleId) },
  );
  return response.data?.data || response.data;
}

export async function unassignSupplierTransfer(transferId) {
  if (!transferId) throw new Error("Transfer kimliği bulunamadı.");
  const response = await apiClient.patch(`/supplier-portal/transfers/${transferId}/unassign`);
  return response.data?.data || response.data;
}

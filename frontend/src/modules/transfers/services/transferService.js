import apiClient from "../../../services/apiClient";

const transferService = {
  async getDispatcherTransfers() {
    const response = await apiClient.get("/dispatcher/transfers");
    return response.data;
  },

  async getTransfer(transferId) {
    if (!transferId) throw new Error("Transfer kimliği bulunamadı.");
    const response = await apiClient.get(`/transfers/${transferId}`);
    return response.data?.data || response.data;
  },

  async getSupplierMatches(transferId) {
    if (!transferId) throw new Error("Öneri alınacak transfer bulunamadı.");
    const response = await apiClient.get(`/dispatcher/transfers/${transferId}/supplier-matches`);
    return Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data)
        ? response.data
        : [];
  },

  async getTrackingLink(transferId) {
    if (!transferId) throw new Error("Takip bağlantısı alınacak transfer bulunamadı.");
    const response = await apiClient.get(`/transfers/${transferId}/tracking-link`);
    return response.data?.data || response.data;
  },

  async getTransferEvidences(transferId) {
    if (!transferId) throw new Error("Kanıtları görüntülenecek transfer bulunamadı.");
    const response = await apiClient.get(`/transfers/${transferId}/evidences`);
    return Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data)
        ? response.data
        : [];
  },

  async getDrivers() {
    const response = await apiClient.get("/drivers");
    return Array.isArray(response.data?.data) ? response.data.data : [];
  },

  async createDispatcherTransfer(payload) {
    const response = await apiClient.post("/dispatcher/transfers", payload);
    return response.data;
  },

  async importDispatcherTransfers(file) {
    if (!file) throw new Error("Aktarılacak Excel dosyası seçilmedi.");
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post("/dispatcher/transfers/import", formData);
    return response.data;
  },

  async bulkAssignSupplier(transferIds, supplierId) {
    if (!Array.isArray(transferIds) || transferIds.length === 0) {
      throw new Error("Toplu atama için en az bir transfer seçilmelidir.");
    }
    if (!supplierId) throw new Error("Tedarikçi seçilmelidir.");
    const response = await apiClient.post("/dispatcher/transfers/bulk-assign-supplier", {
      transfer_ids: transferIds.map(Number),
      supplier_id: Number(supplierId),
    });
    return response.data;
  },

  async updateDispatcherTransfer(transferId, payload) {
    if (!transferId) throw new Error("Düzenlenecek transfer bulunamadı.");
    const response = await apiClient.patch(`/dispatcher/transfers/${transferId}`, payload);
    return response.data?.data || response.data;
  },

  async cancelDispatcherTransfer(transferId, reason) {
    if (!transferId) throw new Error("İptal edilecek transfer bulunamadı.");
    const cancellationReason = String(reason || "").trim();
    if (cancellationReason.length < 10) {
      throw new Error("İptal nedeni en az 10 karakter olmalıdır.");
    }
    const response = await apiClient.patch(`/dispatcher/transfers/${transferId}/cancel`, {
      reason: cancellationReason,
    });
    return response.data?.data || response.data;
  },
};

export default transferService;

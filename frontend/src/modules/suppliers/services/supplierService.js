import apiClient from "../../../services/apiClient";

const supplierService = {
  async getSuppliers(params = {}) {
    const response = await apiClient.get("/suppliers", { params });
    return response.data;
  },

  async getSupplier(id) {
    if (!id) throw new Error("Tedarikçi kimliği bulunamadı.");
    const response = await apiClient.get(`/suppliers/${id}`);
    return response.data?.data || response.data;
  },

  async createSupplierWithAccount(payload) {
    const response = await apiClient.post("/suppliers/with-account", payload);
    return response.data?.data || response.data;
  },

  async getDocuments(supplierId, params = {}) {
    const response = await apiClient.get(`/suppliers/${supplierId}/documents`, { params });
    return response.data;
  },

  async uploadDocument(supplierId, payload) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") formData.append(key, value);
    });
    const response = await apiClient.post(`/suppliers/${supplierId}/documents`, formData);
    return response.data?.data || response.data;
  },

  async deleteDocument(supplierId, documentId) {
    const response = await apiClient.delete(`/suppliers/${supplierId}/documents/${documentId}`);
    return response.data;
  },
};

export default supplierService;

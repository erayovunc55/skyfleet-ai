import apiClient from "../../../services/apiClient";
import "../../../styles/modules/supplier-compliance.css";

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

  async getActivity(supplierId, params = {}) {
    const response = await apiClient.get(`/suppliers/${supplierId}/activity`, { params });
    return response.data;
  },

  async getCoverages(supplierId) {
    const response = await apiClient.get(`/suppliers/${supplierId}/coverages`);
    return Array.isArray(response.data?.data) ? response.data.data : [];
  },

  async addCoverage(supplierId, payload) {
    const response = await apiClient.post(`/suppliers/${supplierId}/coverages`, payload);
    return response.data?.data || response.data;
  },

  async updateCoverage(supplierId, coverageId, payload) {
    const response = await apiClient.patch(`/suppliers/${supplierId}/coverages/${coverageId}`, payload);
    return response.data?.data || response.data;
  },

  async deleteCoverage(supplierId, coverageId) {
    const response = await apiClient.delete(`/suppliers/${supplierId}/coverages/${coverageId}`);
    return response.data;
  },
};

export default supplierService;
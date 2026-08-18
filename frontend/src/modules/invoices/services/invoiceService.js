import apiClient from "../../../services/apiClient";

const invoiceService = {
  async getInvoices(filters = {}) {
    const params = {
      page: filters.page || 1,
      per_page: filters.perPage || 25,
    };
    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.currency) params.currency = filters.currency;
    if (filters.dateFrom) params.date_from = filters.dateFrom;
    if (filters.dateTo) params.date_to = filters.dateTo;

    const response = await apiClient.get("/admin/invoices", { params });
    return response.data;
  },

  async getInvoice(invoiceId) {
    if (!invoiceId) throw new Error("Fatura kimliği bulunamadı.");
    const response = await apiClient.get(`/admin/invoices/${invoiceId}`);
    return response.data?.data || response.data;
  },

  async approve(invoiceId) {
    if (!invoiceId) throw new Error("Fatura kimliği bulunamadı.");
    const response = await apiClient.patch(`/admin/invoices/${invoiceId}/approve`);
    return response.data;
  },

  async requestRevision(invoiceId, reason) {
    if (!invoiceId) throw new Error("Fatura kimliği bulunamadı.");
    const response = await apiClient.patch(`/admin/invoices/${invoiceId}/request-revision`, { reason });
    return response.data;
  },

  async reject(invoiceId, reason) {
    if (!invoiceId) throw new Error("Fatura kimliği bulunamadı.");
    const response = await apiClient.patch(`/admin/invoices/${invoiceId}/reject`, { reason });
    return response.data;
  },

  async download(invoiceId, fileName = "fatura") {
    if (!invoiceId) throw new Error("Fatura kimliği bulunamadı.");
    const response = await apiClient.get(`/admin/invoices/${invoiceId}/download`, {
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
  },
};

export default invoiceService;

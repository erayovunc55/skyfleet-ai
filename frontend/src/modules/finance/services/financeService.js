import apiClient from "../../../services/apiClient";

const financeService = {
  async getFinancials(params = {}) {
    const response = await apiClient.get(
      "/admin/finance",
      { params },
    );

    return response.data;
  },

  async synchronize() {
    const response = await apiClient.post(
      "/admin/finance/synchronize",
    );

    return response.data;
  },

  async approve(financialId, note = "") {
    const response = await apiClient.patch(
      `/admin/finance/${financialId}/approve`,
      { note: note || null },
    );

    return response.data;
  },

  async markPaid(financialId, payload) {
    const response = await apiClient.patch(
      `/admin/finance/${financialId}/paid`,
      payload,
    );

    return response.data;
  },

  async dispute(financialId, note) {
    const response = await apiClient.patch(
      `/admin/finance/${financialId}/dispute`,
      { note },
    );

    return response.data;
  },

  async bulkApprove(financialIds, note = "") {
    const response = await apiClient.post(
      "/admin/finance/bulk-approve",
      { financial_ids: financialIds, note: note || null },
    );

    return response.data;
  },

  async bulkMarkPaid(financialIds, payload) {
    const response = await apiClient.post(
      "/admin/finance/bulk-paid",
      { financial_ids: financialIds, ...payload },
    );

    return response.data;
  },
};

export default financeService;

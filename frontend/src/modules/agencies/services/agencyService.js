import apiClient from "../../../services/apiClient";

const agencyService = {
  async getAgencies() {
    const response = await apiClient.get("/admin/agencies");
    return response.data?.data || [];
  },

  async getAgency(agencyId) {
    const response = await apiClient.get(`/admin/agencies/${agencyId}`);
    return response.data?.data || null;
  },

  async createAgency(payload) {
    const response = await apiClient.post("/admin/agencies", payload);
    return response.data?.data || response.data;
  },

  async updateAgency(agencyId, payload) {
    const response = await apiClient.patch(`/admin/agencies/${agencyId}`, payload);
    return response.data?.data || response.data;
  },

  async toggleAgencyStatus(agencyId) {
    const response = await apiClient.patch(
      `/admin/agencies/${agencyId}/toggle-status`,
    );

    return response.data?.data || response.data;
  },

  async createAgencyUser(agencyId, payload) {
    const response = await apiClient.post(
      `/admin/agencies/${agencyId}/users`,
      payload,
    );

    return response.data?.data || response.data;
  },
};

export default agencyService;

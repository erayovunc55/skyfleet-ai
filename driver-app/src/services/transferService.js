import apiClient from "./apiClient";

const transferService = {
  async getMeetingPreference() {
    const response = await apiClient.get("/driver/meeting-preference");
    return response.data.data;
  },
  async setMeetingPreference(optedIn) {
    const response = await apiClient.put("/driver/meeting-preference", { opted_in: optedIn });
    return response.data.data;
  },
  async getAssignedTransfers() {
    const response = await apiClient.get("/driver/transfers");
    return Array.isArray(response.data?.data) ? response.data.data : [];
  },
  async getDashboard() {
    const response = await apiClient.get("/driver/dashboard");
    return response.data?.data;
  },
  async updateStatus(transferId, status, note = null) {
    const response = await apiClient.patch(`/transfers/${transferId}/status`, { status, note });
    return response.data;
  },
  async recordContactEvent(transferId, eventType, location = null, note = null) {
    const response = await apiClient.post(`/transfers/${transferId}/event`, {
      event_type: eventType,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      accuracy: location?.accuracy ?? null,
      note,
    });
    return response.data;
  },
  async getTrackingLink(transferId) {
    if (!transferId) {
      throw new Error("Takip bağlantısı alınacak transfer bulunamadı.");
    }

    const response = await apiClient.get(
      `/transfers/${transferId}/tracking-link`,
    );

    return response.data?.data || response.data;
  },
};

export default transferService;

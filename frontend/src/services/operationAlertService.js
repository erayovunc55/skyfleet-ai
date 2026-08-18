import apiClient from "./apiClient";

const operationAlertService = {
  async getAlerts() {
    const response = await apiClient.get(
      "/admin/alerts",
    );
    return response.data?.data || response.data;
  },

  async markRead(alertKeys) {
    if (
      !Array.isArray(alertKeys) ||
      alertKeys.length === 0
    ) {
      return null;
    }

    const response = await apiClient.post(
      "/admin/alerts/read",
      {
        alert_keys: alertKeys,
      },
    );
    return response.data;
  },
};

export default operationAlertService;

import apiClient from "./apiClient";

const SEVERITY = {
  critical: 3,
  warning: 2,
  info: 1,
};

const operationAlertService = {
  async getAlerts() {
    const [operationResponse, flightResponse] = await Promise.all([
      apiClient.get("/admin/alerts"),
      apiClient.get("/admin/flight-alerts"),
    ]);

    const operationData = operationResponse.data?.data || operationResponse.data || {};
    const flightData = flightResponse.data?.data || flightResponse.data || {};

    const items = [
      ...(Array.isArray(operationData.items) ? operationData.items : []),
      ...(Array.isArray(flightData.items) ? flightData.items : []),
    ]
      .sort((left, right) => {
        const severityDifference =
          (SEVERITY[right.level] || 0) - (SEVERITY[left.level] || 0);

        if (severityDifference !== 0) return severityDifference;

        return new Date(right.occurred_at || 0).getTime() -
          new Date(left.occurred_at || 0).getTime();
      })
      .slice(0, 40);

    return {
      generated_at: new Date().toISOString(),
      unread_count: items.filter((item) => !item.is_read).length,
      counts: {
        critical: items.filter((item) => item.level === "critical").length,
        warning: items.filter((item) => item.level === "warning").length,
        info: items.filter((item) => item.level === "info").length,
      },
      items,
    };
  },

  async markRead(alertKeys) {
    if (!Array.isArray(alertKeys) || alertKeys.length === 0) {
      return null;
    }

    const response = await apiClient.post("/admin/alerts/read", {
      alert_keys: alertKeys,
    });

    return response.data;
  },
};

export default operationAlertService;

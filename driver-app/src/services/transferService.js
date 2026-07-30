import apiClient from "./apiClient";

const transferService = {
  async getAssignedTransfers() {
    const response = await apiClient.get(
      "/driver/transfers",
    );

    return Array.isArray(response.data?.data)
      ? response.data.data
      : [];
  },

  async updateStatus(
    transferId,
    status,
    note = null,
  ) {
    const response = await apiClient.patch(
      `/transfers/${transferId}/status`,
      {
        status,
        note,
      },
    );

    return response.data;
  },
};

export default transferService;
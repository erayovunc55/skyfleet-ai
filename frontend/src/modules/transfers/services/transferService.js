import apiClient from "../../../services/apiClient";

const transferService = {
  async getDispatcherTransfers() {
    const response = await apiClient.get(
      "/dispatcher/transfers",
    );

    return response.data;
  },

 async getTransfer(transferId) {
  if (!transferId) {
    throw new Error(
      "Transfer kimliği bulunamadı.",
    );
  }

  const response = await apiClient.get(
    `/transfers/${transferId}`,
  );

  return response.data?.data || response.data;
},
};

export default transferService;
import apiClient from "../../../services/apiClient";

const supplierService = {
  async getSuppliers(params = {}) {
    const response = await apiClient.get(
      "/suppliers",
      {
        params,
      },
    );

    return response.data;
  },

  async getSupplier(id) {
    if (!id) {
      throw new Error(
        "Tedarikçi kimliği bulunamadı.",
      );
    }

    const response = await apiClient.get(
      `/suppliers/${id}`,
    );

    return (
      response.data?.data ||
      response.data
    );
  },

  async createSupplierWithAccount(
    payload,
  ) {
    const response = await apiClient.post(
      "/suppliers/with-account",
      payload,
    );

    return (
      response.data?.data ||
      response.data
    );
  },
};

export default supplierService;
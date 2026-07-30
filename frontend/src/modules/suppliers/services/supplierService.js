import apiClient from "../../../services/apiClient";

const supplierService = {
  async getSuppliers(params = {}) {
    const response = await apiClient.get("/suppliers", {
      params,
    });

    return response.data;
  },

  async getSupplier(id) {
    const response = await apiClient.get(
      `/suppliers/${id}`,
    );

    return response.data;
  },
};

export default supplierService;
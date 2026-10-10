import apiClient from "./apiClient";

const aiTrainingService = {
  async list(params = {}) {
    const response = await apiClient.get(
      "/admin/ai-training",
      { params }
    );

    return response.data;
  },

  async search(params = {}) {
    const response = await apiClient.get(
      "/admin/ai-training/search",
      { params }
    );

    return response.data;
  },

  async get(id) {
    const response = await apiClient.get(
      `/admin/ai-training/${id}`
    );

    return response.data;
  },

  async create(payload) {
    const response = await apiClient.post(
      "/admin/ai-training",
      payload
    );

    return response.data;
  },

  async update(id, payload) {
    const response = await apiClient.put(
      `/admin/ai-training/${id}`,
      payload
    );

    return response.data;
  },

  async remove(id) {
    const response = await apiClient.delete(
      `/admin/ai-training/${id}`
    );

    return response.data;
  },
};

export default aiTrainingService;
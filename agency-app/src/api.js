import axios from "axios";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "/backend-api"
).replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_URL,

  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("agency_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("agency_token");
      localStorage.removeItem("agency_user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;
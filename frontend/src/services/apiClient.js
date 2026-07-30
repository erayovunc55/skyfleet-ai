import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api";

const TOKEN_KEY = "skyfleet_token";
const USER_KEY = "skyfleet_user";

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,

  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(TOKEN_KEY);

    if (token) {
      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      window.dispatchEvent(
        new CustomEvent(
          "skyfleet:unauthenticated",
        ),
      );
    }

    return Promise.reject(error);
  },
);

export default apiClient;
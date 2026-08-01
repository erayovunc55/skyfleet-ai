import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "/api";

const TOKEN_KEY =
  "skyfleet_token";

const USER_KEY =
  "skyfleet_user";

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        TOKEN_KEY,
      );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    /*
     * FormData gönderirken Content-Type değerini
     * tarayıcı belirlemelidir. Böylece multipart
     * boundary otomatik eklenir.
     */
    if (config.data instanceof FormData) {
      if (
        typeof config.headers
          ?.setContentType === "function"
      ) {
        config.headers.setContentType(
          undefined,
        );
      } else {
        delete config.headers[
          "Content-Type"
        ];

        delete config.headers[
          "content-type"
        ];
      }
    } else {
      config.headers[
        "Content-Type"
      ] = "application/json";
    }

    return config;
  },
  (error) =>
    Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,

  (error) => {
    if (
      error?.response?.status ===
      401
    ) {
      localStorage.removeItem(
        TOKEN_KEY,
      );

      localStorage.removeItem(
        USER_KEY,
      );

      window.dispatchEvent(
        new CustomEvent(
          "skyfleet-driver:unauthenticated",
        ),
      );
    }

    return Promise.reject(error);
  },
);

export {
  TOKEN_KEY,
  USER_KEY,
};

export default apiClient;
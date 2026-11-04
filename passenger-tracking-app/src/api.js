import axios from "axios";

function resolveApiUrl() {
  const configuredUrl =
    import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");

  if (configuredUrl) {
    /*
     * Canlı .env içinde eski şekilde:
     *
     * https://skytriptransfer.com/api
     *
     * tanımlıysa otomatik olarak:
     *
     * https://skytriptransfer.com/api/index.php
     *
     * haline getir.
     */
    if (
      import.meta.env.PROD &&
      configuredUrl.endsWith("/api")
    ) {
      return `${configuredUrl}/index.php`;
    }

    return configuredUrl;
  }

  /*
   * Production:
   * /api/index.php/public/...
   *
   * Local:
   * http://127.0.0.1:8000/public/...
   */
  return import.meta.env.PROD
    ? "/api/index.php"
    : "http://127.0.0.1:8000";
}

const API_URL = resolveApiUrl();

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});

export async function getPublicTracking(token) {
  if (!token) {
    throw new Error("Takip bağlantısı eksik.");
  }

  const response = await api.get(
    `/public/tracking/${encodeURIComponent(token)}`,
  );

  return response.data?.data || response.data;
}

export async function getPassengerSupportMessages(token) {
  if (!token) {
    throw new Error("Takip bağlantısı eksik.");
  }

  const response = await api.get(
    `/public/tracking/${encodeURIComponent(token)}/messages`,
  );

  return (
    response.data?.data?.messages ||
    response.data?.messages ||
    []
  );
}

export async function sendPassengerSupportMessage(
  token,
  {
    message,
    category = "general",
    language = null,
  },
) {
  if (!token) {
    throw new Error("Takip bağlantısı eksik.");
  }

  if (!message?.trim()) {
    throw new Error("Mesaj boş olamaz.");
  }

  const response = await api.post(
    `/public/tracking/${encodeURIComponent(token)}/messages`,
    {
      message: message.trim(),
      category,
      language,
    },
  );

  return response.data?.data || response.data;
}
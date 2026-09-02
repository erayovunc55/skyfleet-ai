import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api";

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

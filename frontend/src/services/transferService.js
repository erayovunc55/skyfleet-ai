const API_URL = import.meta.env.VITE_API_URL;

export async function getTransfers() {
  const token = localStorage.getItem("skyfleet_token");

  const response = await fetch(
    `${API_URL}/transfers`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message || "Transferler yüklenemedi.",
    );
  }

  return data.data;
}
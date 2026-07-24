const API_URL = import.meta.env.VITE_API_URL;

export async function sendDriverLocation(
  transferId,
  location,
) {
  const token = localStorage.getItem("skyfleet_token");

  const response = await fetch(
    `${API_URL}/transfers/${transferId}/location`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(location),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message || "Canlı konum gönderilemedi.",
    );
  }

  return data.data;
}
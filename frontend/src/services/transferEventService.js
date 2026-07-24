const API_URL = import.meta.env.VITE_API_URL;

export async function sendTransferEvent(
  transferId,
  eventType,
  payload = {},
) {
  const token = localStorage.getItem("skyfleet_token");

  const response = await fetch(
    `${API_URL}/transfers/${transferId}/event`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: eventType,
        ...payload,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message || "Transfer durumu güncellenemedi.",
    );
  }

  return data;
}
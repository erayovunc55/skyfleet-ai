const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");

function headers() {
  return {
    Authorization: `Bearer ${localStorage.getItem("skyfleet_panel_token")}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

export async function getTransferRequests({ status = "", search = "" } = {}) {
  const params = new URLSearchParams({ per_page: "100" });
  if (status) params.set("status", status);
  if (search.trim()) params.set("search", search.trim());

  const response = await fetch(`${API_URL}/admin/transfer-requests?${params}`, {
    headers: headers(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || "Transfer requests could not be loaded.");
  return data;
}

export async function updateTransferRequestStatus(id, status) {
  const response = await fetch(`${API_URL}/admin/transfer-requests/${id}/status`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ status }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || "Status could not be updated.");
  return data.data;
}

export async function convertTransferRequest(id, payload) {
  const response = await fetch(`${API_URL}/admin/transfer-requests/${id}/convert`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || "Transfer could not be created.");
  return data;
}


const API_URL = import.meta.env.VITE_API_URL;

function getAuthHeaders() {
  const token = localStorage.getItem("skyfleet_token");

  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

async function parseResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Araç işlemi gerçekleştirilemedi.",
    );
  }

  return data;
}

export async function getVehicles() {
  const response = await fetch(
    `${API_URL}/vehicles`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  const data = await parseResponse(response);

  return data.data;
}

export async function createVehicle(payload) {
  const response = await fetch(
    `${API_URL}/vehicles`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  return parseResponse(response);
}

export async function updateVehicle(
  vehicleId,
  payload,
) {
  const response = await fetch(
    `${API_URL}/vehicles/${vehicleId}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  return parseResponse(response);
}

export async function deactivateVehicle(vehicleId) {
  const response = await fetch(
    `${API_URL}/vehicles/${vehicleId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

  return parseResponse(response);
}

export async function changeVehicleStatus(
  vehicleId,
  operationalStatus,
) {
  const response = await fetch(
    `${API_URL}/vehicles/${vehicleId}/status`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        operational_status: operationalStatus,
      }),
    },
  );

  return parseResponse(response);
}
export async function uploadVehiclePhoto(
  vehicleId,
  photoFile,
) {
  const token = localStorage.getItem("skyfleet_token");

  const formData = new FormData();
  formData.append("photo", photoFile);

  const response = await fetch(
    `${API_URL}/vehicles/${vehicleId}/photo`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: formData,
    },
  );

  return parseResponse(response);
}
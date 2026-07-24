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
  let data = null;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Sunucudan geçersiz bir cevap alındı.",
    );
  }

  if (response.status === 401) {
    localStorage.removeItem("skyfleet_token");
    localStorage.removeItem("skyfleet_user");

    throw new Error(
      "Oturum süresi doldu. Tekrar giriş yapmalısınız.",
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Sürücü işlemi gerçekleştirilemedi.",
    );
  }

  return data;
}

export async function getDrivers() {
  const response = await fetch(
    `${API_URL}/drivers`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  const data = await parseResponse(response);

  return Array.isArray(data.data)
    ? data.data
    : [];
}

export async function assignVehicleToDriver(
  driverId,
  vehicleId,
) {
  const response = await fetch(
    `${API_URL}/drivers/${driverId}/vehicle`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        vehicle_id: vehicleId || null,
      }),
    },
  );

  return parseResponse(response);
}

export async function removeVehicleFromDriver(
  driverId,
) {
  return assignVehicleToDriver(
    driverId,
    null,
  );
}
import apiClient from "./apiClient";

export async function getDrivers() {
  const response =
    await apiClient.get("/drivers");

  return Array.isArray(
    response.data?.data,
  )
    ? response.data.data
    : [];
}

export async function createDriver(
  payload,
) {
  const response =
    await apiClient.post(
      "/drivers",
      payload,
    );

  return (
    response.data?.data ||
    response.data
  );
}

export async function updateDriver(
  driverId,
  payload,
) {
  if (!driverId) {
    throw new Error(
      "Sürücü kimliği bulunamadı.",
    );
  }

  const response =
    await apiClient.patch(
      `/drivers/${driverId}`,
      payload,
    );

  return (
    response.data?.data ||
    response.data
  );
}

export async function assignVehicleToDriver(
  driverId,
  vehicleId,
) {
  if (!driverId) {
    throw new Error(
      "Sürücü kimliği bulunamadı.",
    );
  }

  const response =
    await apiClient.patch(
      `/drivers/${driverId}/vehicle`,
      {
        vehicle_id:
          vehicleId || null,
      },
    );

  return (
    response.data?.data ||
    response.data
  );
}

export async function removeVehicleFromDriver(
  driverId,
) {
  return assignVehicleToDriver(
    driverId,
    null,
  );
}
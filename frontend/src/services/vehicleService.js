import apiClient from "./apiClient";

export async function getVehicles() {
  const response =
    await apiClient.get("/vehicles");

  return Array.isArray(
    response.data?.data,
  )
    ? response.data.data
    : [];
}

export async function createVehicle(
  payload,
) {
  const response =
    await apiClient.post(
      "/vehicles",
      payload,
    );

  return response.data;
}

export async function updateVehicle(
  vehicleId,
  payload,
) {
  const response =
    await apiClient.patch(
      `/vehicles/${vehicleId}`,
      payload,
    );

  return response.data;
}

export async function deactivateVehicle(
  vehicleId,
) {
  const response =
    await apiClient.delete(
      `/vehicles/${vehicleId}`,
    );

  return response.data;
}

export async function changeVehicleStatus(
  vehicleId,
  operationalStatus,
) {
  const response =
    await apiClient.patch(
      `/vehicles/${vehicleId}/status`,
      {
        operational_status:
          operationalStatus,
      },
    );

  return response.data;
}

export async function uploadVehiclePhoto(
  vehicleId,
  photoFile,
) {
  const formData = new FormData();

  formData.append(
    "photo",
    photoFile,
  );

  const response =
    await apiClient.post(
      `/vehicles/${vehicleId}/photo`,
      formData,
    );

  return response.data;
}
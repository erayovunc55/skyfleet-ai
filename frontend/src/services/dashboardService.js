import apiClient from "./apiClient";

export async function getAdminDashboard() {
  const response = await apiClient.get(
    "/admin/dashboard",
  );

  return (
    response.data?.data ||
    response.data
  );
}
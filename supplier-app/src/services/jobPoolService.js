import apiClient from "./apiClient";

export async function getAvailableJobs(limit = 50) {
  const response = await apiClient.get("/supplier-portal/available-jobs", {
    params: { limit },
  });

  return {
    jobs: Array.isArray(response.data?.data) ? response.data.data : [],
    meta: response.data?.meta || {},
  };
}

export async function acceptAvailableJob(transferId) {
  if (!transferId) {
    throw new Error("Transfer kimliği bulunamadı.");
  }

  const response = await apiClient.post(
    `/supplier-portal/available-jobs/${transferId}/accept`,
  );

  return response.data;
}

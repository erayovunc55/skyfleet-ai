import apiClient from "../../../services/apiClient";

const driverLocationService = {
  async sendLocation(transferId, location) {
    if (!transferId) {
      throw new Error("Transfer kimliği bulunamadı.");
    }

    const response = await apiClient.post(
      `/transfers/${transferId}/location`,
      {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy ?? null,
        speed: normalizeSpeed(location.speed),
        heading: location.heading ?? null,
        recorded_at:
          location.recordedAt ||
          new Date().toISOString(),
      },
    );

    return response.data;
  },
};

function normalizeSpeed(speedInMetersPerSecond) {
  const speed = Number(speedInMetersPerSecond);

  if (!Number.isFinite(speed) || speed < 0) {
    return null;
  }

  // Tarayıcı hızı m/s olarak verir.
  // API için km/saat değerine çeviriyoruz.
  return Number((speed * 3.6).toFixed(2));
}

export default driverLocationService;
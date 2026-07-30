import apiClient from "./apiClient";

const driverLocationService = {
  async sendLocation(
    transferId,
    location,
  ) {
    if (!transferId) {
      throw new Error(
        "Transfer kimliği bulunamadı.",
      );
    }

    const response = await apiClient.post(
      `/transfers/${transferId}/location`,
      {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy:
          location.accuracy ?? null,
        speed: convertSpeedToKmh(
          location.speed,
        ),
        heading:
          location.heading ?? null,
        recorded_at:
          location.recordedAt ||
          new Date().toISOString(),
      },
    );

    return response.data;
  },
};

function convertSpeedToKmh(
  speedInMetersPerSecond,
) {
  const speed = Number(
    speedInMetersPerSecond,
  );

  if (
    !Number.isFinite(speed) ||
    speed < 0
  ) {
    return null;
  }

  return Number(
    (speed * 3.6).toFixed(2),
  );
}

export default driverLocationService;
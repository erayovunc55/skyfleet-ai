import apiClient from "./apiClient";

const evidenceService = {
  async uploadNoShowEvidence({
    transferId,
    photo,
    location,
    note,
  }) {
    if (!transferId) {
      throw new Error(
        "Transfer kimliği bulunamadı.",
      );
    }

    if (!(photo instanceof File)) {
      throw new Error(
        "Fotoğraf dosyası bulunamadı.",
      );
    }

    if (
      location?.latitude == null ||
      location?.longitude == null
    ) {
      throw new Error(
        "GPS konumu bulunamadı.",
      );
    }

    const formData =
      new FormData();

    formData.append(
      "photo",
      photo,
      photo.name ||
        `no-show-${Date.now()}.jpg`,
    );

    formData.append(
      "latitude",
      String(location.latitude),
    );

    formData.append(
      "longitude",
      String(location.longitude),
    );

    if (
      location.accuracy != null
    ) {
      formData.append(
        "accuracy",
        String(location.accuracy),
      );
    }

    if (note?.trim()) {
      formData.append(
        "note",
        note.trim(),
      );
    }

    const response =
      await apiClient.post(
        `/transfers/${transferId}/no-show-evidence`,
        formData,
      );

    return response.data;
  },
};

export default evidenceService;
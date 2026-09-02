import apiClient from "./apiClient";

const evidenceService = {
  async getContactSummary(transferId) {
    const response = await apiClient.get(`/transfers/${transferId}`);
    const events = Array.isArray(response.data?.data?.events)
      ? response.data.data.events
      : [];
    return {
      callAttempts: events.filter(
        (event) => event?.event_type === "passenger_call_attempted",
      ).length,
      whatsappAttempted: events.some(
        (event) => event?.event_type === "passenger_whatsapp_opened",
      ),
    };
  },

  async uploadNoShowEvidence({ transferId, photo, location, note, details }) {
    if (!transferId) throw new Error("Transfer kimliği bulunamadı.");
    if (!(photo instanceof File)) throw new Error("Fotoğraf dosyası bulunamadı.");
    if (location?.latitude == null || location?.longitude == null) {
      throw new Error("GPS konumu bulunamadı.");
    }

    const formData = new FormData();
    formData.append("photo", photo, photo.name || `no-show-${Date.now()}.jpg`);
    formData.append("latitude", String(location.latitude));
    formData.append("longitude", String(location.longitude));
    if (location.accuracy != null) formData.append("accuracy", String(location.accuracy));
    formData.append("wait_minutes", String(details.waitMinutes));
    formData.append("call_attempts", String(details.callAttempts));
    formData.append("passenger_called", details.passengerCalled ? "1" : "0");
    formData.append("whatsapp_attempted", details.whatsappAttempted ? "1" : "0");
    formData.append("contact_result", details.contactResult);
    if (note?.trim()) formData.append("note", note.trim());

    const response = await apiClient.post(
      `/transfers/${transferId}/no-show-evidence`,
      formData,
    );
    return response.data;
  },
};

export default evidenceService;

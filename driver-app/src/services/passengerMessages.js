export function createWhatsAppMessage(transfer) {
  return [
    `Hello ${transfer.passenger_name || "Guest"},`,
    "",
    `I am your SkyTrip Transfer driver${transfer.driver?.name ? `, ${transfer.driver.name}` : ""}.`,
    `Booking reference: ${transfer.booking_reference || "-"}`,
    "",
    "I have opened this WhatsApp conversation to contact you about your transfer.",
  ].join("\n");
}

export function createTrackingWhatsAppMessage(transfer, trackingUrl) {
  return [
    `Hello ${transfer.passenger_name || "Guest"},`,
    "",
    "Your driver is on the way. You can track your vehicle's live location using the link below:",
    trackingUrl,
    "",
    `Booking reference: ${transfer.booking_reference || "-"}`,
  ].join("\n");
}

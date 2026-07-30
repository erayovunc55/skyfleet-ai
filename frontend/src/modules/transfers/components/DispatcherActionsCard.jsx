import {
  Button,
  Card,
} from "../../../components/ui";

import useTransfer from "../hooks/useTransfer";

export default function DispatcherActionsCard() {
  const { selectedTransfer } = useTransfer();

  if (!selectedTransfer) {
    return null;
  }

  const passengerPhone = normalizePhone(
    selectedTransfer.passenger_phone,
  );

  const driverPhone = normalizePhone(
    selectedTransfer.driver?.phone,
  );

  const pickupCoordinates = getCoordinates(
    selectedTransfer.pickup_location?.latitude ??
      selectedTransfer.pickup_lat,
    selectedTransfer.pickup_location?.longitude ??
      selectedTransfer.pickup_lng,
  );

  const dropoffCoordinates = getCoordinates(
    selectedTransfer.dropoff_location?.latitude ??
      selectedTransfer.dropoff_lat,
    selectedTransfer.dropoff_location?.longitude ??
      selectedTransfer.dropoff_lng,
  );

  function callPassenger() {
    if (!passengerPhone) {
      return;
    }

    window.location.href = `tel:${passengerPhone}`;
  }

  function callDriver() {
    if (!driverPhone) {
      return;
    }

    window.location.href = `tel:${driverPhone}`;
  }

  function openPassengerWhatsApp() {
    if (!passengerPhone) {
      return;
    }

    const message = createPassengerMessage(
      selectedTransfer,
    );

    const url =
      `https://wa.me/${passengerPhone}` +
      `?text=${encodeURIComponent(message)}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function openPickupMap() {
    openGoogleMaps({
      coordinates: pickupCoordinates,
      fallbackAddress:
        selectedTransfer.pickup_location?.name ||
        selectedTransfer.pickup,
    });
  }

  function openDropoffMap() {
    openGoogleMaps({
      coordinates: dropoffCoordinates,
      fallbackAddress:
        selectedTransfer.dropoff_location?.name ||
        selectedTransfer.dropoff,
    });
  }

  return (
    <Card
      title="Dispatcher İşlemleri"
      subtitle="Hızlı operasyon araçları"
    >
      <div className="dispatcher-actions-grid">
        <Button
          variant="secondary"
          disabled={!passengerPhone}
          onClick={callPassenger}
        >
          ☎ Yolcuyu Ara
        </Button>

        <Button
          variant="secondary"
          disabled={!driverPhone}
          onClick={callDriver}
        >
          ☎ Sürücüyü Ara
        </Button>

        <Button
          variant="success"
          disabled={!passengerPhone}
          onClick={openPassengerWhatsApp}
        >
          💬 Yolcu WhatsApp
        </Button>

        <Button
          variant="ghost"
          disabled={
            !pickupCoordinates &&
            !selectedTransfer.pickup
          }
          onClick={openPickupMap}
        >
          📍 Pickup Haritası
        </Button>

        <Button
          variant="ghost"
          disabled={
            !dropoffCoordinates &&
            !selectedTransfer.dropoff
          }
          onClick={openDropoffMap}
        >
          🏁 Dropoff Haritası
        </Button>
      </div>

      <div className="dispatcher-action-contact-summary">
        <ContactRow
          label="Yolcu telefonu"
          value={
            selectedTransfer.passenger_phone ||
            "Telefon bilgisi yok"
          }
        />

        <ContactRow
          label="Sürücü telefonu"
          value={
            selectedTransfer.driver?.phone ||
            "Sürücü telefonu yok"
          }
        />
      </div>
    </Card>
  );
}

function ContactRow({
  label,
  value,
}) {
  return (
    <div className="dispatcher-contact-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function normalizePhone(value) {
  if (!value) {
    return "";
  }

  let phone = String(value).replace(/\D/g, "");

  if (phone.startsWith("00")) {
    phone = phone.slice(2);
  }

  if (
    phone.length === 10 &&
    phone.startsWith("5")
  ) {
    phone = `90${phone}`;
  }

  if (
    phone.length === 11 &&
    phone.startsWith("0")
  ) {
    phone = `90${phone.slice(1)}`;
  }

  return phone;
}

function getCoordinates(
  latitude,
  longitude,
) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return null;
  }

  return {
    latitude: lat,
    longitude: lng,
  };
}

function openGoogleMaps({
  coordinates,
  fallbackAddress,
}) {
  const destination = coordinates
    ? `${coordinates.latitude},${coordinates.longitude}`
    : fallbackAddress;

  if (!destination) {
    return;
  }

  const url =
    "https://www.google.com/maps/search/" +
    `?api=1&query=${encodeURIComponent(destination)}`;

  window.open(
    url,
    "_blank",
    "noopener,noreferrer",
  );
}

function createPassengerMessage(
  transfer,
) {
  const passengerName =
    transfer.passenger_name || "Değerli misafirimiz";

  const bookingReference =
    transfer.booking_reference || "-";

  const pickup =
    transfer.pickup_location?.name ||
    transfer.pickup ||
    "-";

  const driverName =
    transfer.driver?.name || "henüz atanmadı";

  const vehiclePlate =
    transfer.driver?.vehicle?.plate || "-";

  return [
    `Merhaba ${passengerName},`,
    "",
    `SkyTrip Transfer rezervasyonunuz: ${bookingReference}`,
    `Alış noktası: ${pickup}`,
    `Sürücü: ${driverName}`,
    `Araç plakası: ${vehiclePlate}`,
    "",
    "Operasyon ekibimiz transferinizi takip etmektedir.",
  ].join("\n");
}
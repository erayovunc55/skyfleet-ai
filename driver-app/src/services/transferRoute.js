function text(value) {
  return String(value ?? "").trim();
}

export function getRouteAddress(transfer, type, fallback = "Belirtilmedi") {
  const location = transfer[`${type}_location`];

  return text(transfer[type])
    || text(location?.name)
    || text(location?.code)
    || fallback;
}

function coordinates(lat, lng) {
  if (lat == null || lng == null || text(lat) === "" || text(lng) === "") {
    return "";
  }

  const latitude = Number(lat);
  const longitude = Number(lng);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return "";
  }

  return `${latitude},${longitude}`;
}

export function getRouteDestination(transfer, type) {
  const originalCoordinates = coordinates(transfer[`${type}_lat`], transfer[`${type}_lng`]);
  if (originalCoordinates) return originalCoordinates;
  const originalAddress = text(transfer[type]);
  if (originalAddress) return originalAddress;
  const location = transfer[`${type}_location`];
  return coordinates(location?.latitude, location?.longitude) || getRouteAddress(transfer, type, "");
}

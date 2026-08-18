import apiClient from "./apiClient";

function unwrapList(response) {
  return Array.isArray(response?.data?.data)
    ? response.data.data
    : [];
}

function unwrapItem(response) {
  return response?.data?.data ?? null;
}

export async function getLocationTypes() {
  const response = await apiClient.get("/location-types");
  return unwrapList(response);
}

export async function getCountries() {
  const response = await apiClient.get("/countries");
  return unwrapList(response);
}

export async function getCities(countryId) {
  if (!countryId) return [];
  const response = await apiClient.get(`/countries/${countryId}/cities`);
  return unwrapList(response);
}

export async function getAirports(cityId) {
  if (!cityId) return [];
  const response = await apiClient.get(`/cities/${cityId}/airports`);
  return unwrapList(response);
}

export async function searchAirports(query, limit = 12) {
  const q = String(query || "").trim();
  if (q.length < 2) return [];
  const response = await apiClient.get("/airports/search", {
    params: { q, limit },
  });
  return unwrapList(response);
}

export async function getLocations(cityId, filters = {}) {
  if (!cityId) return [];

  const params = {};
  if (filters.type) params.type = filters.type;
  if (filters.locationTypeId) params.location_type_id = filters.locationTypeId;
  if (filters.search) params.search = filters.search;
  if (filters.pickupOnly) params.pickup_only = 1;
  if (filters.dropoffOnly) params.dropoff_only = 1;

  const response = await apiClient.get(`/cities/${cityId}/locations`, { params });
  return unwrapList(response);
}

export async function getLocation(locationId) {
  if (!locationId) return null;
  const response = await apiClient.get(`/locations/${locationId}`);
  return unwrapItem(response);
}

export async function createLocation(payload) {
  const response = await apiClient.post("/locations", payload);
  return unwrapItem(response);
}

export async function updateLocation(locationId, payload) {
  const response = await apiClient.patch(`/locations/${locationId}`, payload);
  return unwrapItem(response);
}

export async function createLocationPoint(locationId, payload) {
  const response = await apiClient.post(`/locations/${locationId}/points`, payload);
  return unwrapItem(response);
}

export async function getLocationPoints(locationId, filters = {}) {
  if (!locationId) return [];

  const params = {};
  if (filters.pointType) params.point_type = filters.pointType;
  if (filters.pickupOnly) params.pickup_only = 1;
  if (filters.dropoffOnly) params.dropoff_only = 1;

  const response = await apiClient.get(`/locations/${locationId}/points`, { params });
  return unwrapList(response);
}

const API_URL = import.meta.env.VITE_API_URL;

function getAuthHeaders(json = false) {
  const token = localStorage.getItem("skyfleet_token");
  return { Authorization: `Bearer ${token}`, Accept: "application/json", ...(json ? { "Content-Type": "application/json" } : {}) };
}

async function parseResponse(response) {
  let data = null;
  try { data = await response.json(); } catch { throw new Error("The location service returned an invalid response."); }
  if (response.status === 401) {
    localStorage.removeItem("skyfleet_token"); localStorage.removeItem("skyfleet_user");
    throw new Error("Your session has expired. Please sign in again.");
  }
  if (!response.ok) {
    const validation = data?.errors ? Object.values(data.errors).flat().join(" ") : "";
    throw new Error(validation || data?.message || "Location operation failed.");
  }
  return data;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { ...getAuthHeaders(Boolean(options.body)), ...(options.headers || {}) } });
  return parseResponse(response);
}

export async function getLocationTypes() { const data = await request("/location-types"); return Array.isArray(data.data) ? data.data : []; }
export async function getCountries() { const data = await request("/countries"); return Array.isArray(data.data) ? data.data : []; }
export async function getCities(countryId) { if (!countryId) return []; const data = await request(`/countries/${countryId}/cities`); return Array.isArray(data.data) ? data.data : []; }
export async function getAirports(cityId) { if (!cityId) return []; const data = await request(`/cities/${cityId}/airports`); return Array.isArray(data.data) ? data.data : []; }

export async function getLocations(cityId, filters = {}) {
  if (!cityId) return [];
  const query = new URLSearchParams();
  if (filters.type) query.set("type", filters.type);
  if (filters.locationTypeId) query.set("location_type_id", String(filters.locationTypeId));
  if (filters.search) query.set("search", filters.search);
  if (filters.pickupOnly) query.set("pickup_only", "1");
  if (filters.dropoffOnly) query.set("dropoff_only", "1");
  const qs = query.toString();
  const data = await request(`/cities/${cityId}/locations${qs ? `?${qs}` : ""}`);
  return Array.isArray(data.data) ? data.data : [];
}

export async function getLocation(locationId) { if (!locationId) return null; const data = await request(`/locations/${locationId}`); return data.data || null; }
export async function createLocation(payload) { const data = await request("/locations", { method: "POST", body: JSON.stringify(payload) }); return data.data; }
export async function updateLocation(locationId, payload) { const data = await request(`/locations/${locationId}`, { method: "PATCH", body: JSON.stringify(payload) }); return data.data; }
export async function createLocationPoint(locationId, payload) { const data = await request(`/locations/${locationId}/points`, { method: "POST", body: JSON.stringify(payload) }); return data.data; }

export async function getLocationPoints(locationId, filters = {}) {
  if (!locationId) return [];
  const query = new URLSearchParams();
  if (filters.pointType) query.set("point_type", filters.pointType);
  if (filters.pickupOnly) query.set("pickup_only", "1");
  if (filters.dropoffOnly) query.set("dropoff_only", "1");
  const qs = query.toString();
  const data = await request(`/locations/${locationId}/points${qs ? `?${qs}` : ""}`);
  return Array.isArray(data.data) ? data.data : [];
}

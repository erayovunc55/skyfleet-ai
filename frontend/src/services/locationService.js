const API_URL = import.meta.env.VITE_API_URL;

function getAuthHeaders() {
  const token = localStorage.getItem("skyfleet_token");

  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
}

async function parseResponse(response) {
  let data = null;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Lokasyon servisinden geçersiz bir cevap alındı.",
    );
  }

  if (response.status === 401) {
    localStorage.removeItem("skyfleet_token");
    localStorage.removeItem("skyfleet_user");

    throw new Error(
      "Oturum süresi doldu. Tekrar giriş yapmalısınız.",
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Lokasyon bilgileri alınamadı.",
    );
  }

  return data;
}

export async function getLocationTypes() {
  const response = await fetch(
    `${API_URL}/location-types`,
    {
      headers: getAuthHeaders(),
    },
  );

  const data = await parseResponse(response);

  return Array.isArray(data.data)
    ? data.data
    : [];
}

export async function getCountries() {
  const response = await fetch(
    `${API_URL}/countries`,
    {
      headers: getAuthHeaders(),
    },
  );

  const data = await parseResponse(response);

  return Array.isArray(data.data)
    ? data.data
    : [];
}

export async function getCities(countryId) {
  if (!countryId) {
    return [];
  }

  const response = await fetch(
    `${API_URL}/countries/${countryId}/cities`,
    {
      headers: getAuthHeaders(),
    },
  );

  const data = await parseResponse(response);

  return Array.isArray(data.data)
    ? data.data
    : [];
}

export async function getLocations(
  cityId,
  filters = {},
) {
  if (!cityId) {
    return [];
  }

  const query = new URLSearchParams();

  if (filters.type) {
    query.set("type", filters.type);
  }

  if (filters.locationTypeId) {
    query.set(
      "location_type_id",
      String(filters.locationTypeId),
    );
  }

  if (filters.search) {
    query.set("search", filters.search);
  }

  if (filters.pickupOnly) {
    query.set("pickup_only", "1");
  }

  if (filters.dropoffOnly) {
    query.set("dropoff_only", "1");
  }

  const queryString = query.toString();

  const response = await fetch(
    `${API_URL}/cities/${cityId}/locations${
      queryString ? `?${queryString}` : ""
    }`,
    {
      headers: getAuthHeaders(),
    },
  );

  const data = await parseResponse(response);

  return Array.isArray(data.data)
    ? data.data
    : [];
}

export async function getLocation(locationId) {
  if (!locationId) {
    return null;
  }

  const response = await fetch(
    `${API_URL}/locations/${locationId}`,
    {
      headers: getAuthHeaders(),
    },
  );

  const data = await parseResponse(response);

  return data.data || null;
}

export async function getLocationPoints(
  locationId,
  filters = {},
) {
  if (!locationId) {
    return [];
  }

  const query = new URLSearchParams();

  if (filters.pointType) {
    query.set("point_type", filters.pointType);
  }

  if (filters.pickupOnly) {
    query.set("pickup_only", "1");
  }

  if (filters.dropoffOnly) {
    query.set("dropoff_only", "1");
  }

  const queryString = query.toString();

  const response = await fetch(
    `${API_URL}/locations/${locationId}/points${
      queryString ? `?${queryString}` : ""
    }`,
    {
      headers: getAuthHeaders(),
    },
  );

  const data = await parseResponse(response);

  return Array.isArray(data.data)
    ? data.data
    : [];
}
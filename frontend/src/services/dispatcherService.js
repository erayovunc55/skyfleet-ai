const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");

export async function getDispatcherTransfers() {
  const token = localStorage.getItem("skyfleet_panel_token");

  if (!token) {
    throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
  }

  const response = await fetch(
    `${API_URL}/dispatcher/transfers`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  );

  const data = await response.json();

  if (response.status === 401) {
    localStorage.removeItem("skyfleet_panel_token");
    localStorage.removeItem("skyfleet_panel_user");

    window.location.reload();

    throw new Error("Oturum süresi doldu.");
  }

  if (!response.ok) {
    throw new Error(
      data?.message || "Operasyon verileri yüklenemedi.",
    );
  }

  return data.data;
}

export async function getHeytripQuotes(payload) {
  const token = localStorage.getItem("skyfleet_panel_token");

  if (!token) {
    throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
  }

  const response = await fetch(`${API_URL}/dispatcher/heytrip/quotes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "HeyTrip fiyatları alınamadı.");
  }

  return data;
}

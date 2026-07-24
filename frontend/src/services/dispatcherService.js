const API_URL = import.meta.env.VITE_API_URL;

export async function getDispatcherTransfers() {
  const token = localStorage.getItem("skyfleet_token");

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
    localStorage.removeItem("skyfleet_token");
    localStorage.removeItem("skyfleet_user");

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
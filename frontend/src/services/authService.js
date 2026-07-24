const API_URL = import.meta.env.VITE_API_URL;

export async function login(phone, password) {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      phone,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.errors?.phone?.[0] ||
        data?.message ||
        "Giriş yapılamadı.",
    );
  }

  localStorage.setItem("skyfleet_token", data.token);
  localStorage.setItem(
    "skyfleet_user",
    JSON.stringify(data.user),
  );

  return data;
}

export function logout() {
  localStorage.removeItem("skyfleet_token");
  localStorage.removeItem("skyfleet_user");
}

export function getStoredUser() {
  const user = localStorage.getItem("skyfleet_user");

  return user ? JSON.parse(user) : null;
}

export function getStoredToken() {
  return localStorage.getItem("skyfleet_token");
}
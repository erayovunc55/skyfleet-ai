const API_URL =
  import.meta.env.VITE_API_URL;

const ALLOWED_PANEL_ROLES = [
  "dispatcher",
  "admin",
  "super_admin",
];

export async function login(
  phone,
  password,
) {
  const response = await fetch(
    `${API_URL}/login`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        Accept:
          "application/json",
      },

      body: JSON.stringify({
        login: phone,
        password,
      }),
    },
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.errors?.login?.[0] ||
        data?.message ||
        "Giriş yapılamadı.",
    );
  }

  if (
    !ALLOWED_PANEL_ROLES.includes(
      data?.user?.role,
    )
  ) {
    throw new Error(
      "Bu hesap dispatcher paneline giriş yapamaz.",
    );
  }

  localStorage.setItem(
    "skyfleet_panel_token",
    data.token,
  );

  localStorage.setItem(
    "skyfleet_user",
    JSON.stringify(data.user),
  );

  return data;
}

export function logout() {
  localStorage.removeItem(
    "skyfleet_panel_token",
  );

  localStorage.removeItem(
    "skyfleet_panel_user",
  );
}

export function getStoredUser() {
  const user =
    localStorage.getItem(
      "skyfleet_panel_user",
    );

  return user
    ? JSON.parse(user)
    : null;
}

export function getStoredToken() {
  return localStorage.getItem(
    "skyfleet_panel_token",
  );
}
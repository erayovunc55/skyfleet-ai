import apiClient, {
  TOKEN_KEY,
  USER_KEY,
} from "./apiClient";

const ALLOWED_PANEL_ROLES = [
  "dispatcher",
  "admin",
  "super_admin",
];

export async function login(
  phone,
  password,
) {
  const response =
    await apiClient.post(
      "/login",
      {
        login: String(
          phone || "",
        ).trim(),

        password:
          String(
            password || "",
          ),
      },
    );

  const data =
    response.data;

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
    TOKEN_KEY,
    data.token,
  );

  localStorage.setItem(
    USER_KEY,
    JSON.stringify(
      data.user,
    ),
  );

  return data;
}

export function logout() {
  localStorage.removeItem(
    TOKEN_KEY,
  );

  localStorage.removeItem(
    USER_KEY,
  );
}

export function getStoredUser() {
  const user =
    localStorage.getItem(
      USER_KEY,
    );

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(
      user,
    );
  } catch {
    localStorage.removeItem(
      USER_KEY,
    );

    return null;
  }
}

export function getStoredToken() {
  return localStorage.getItem(
    TOKEN_KEY,
  );
}
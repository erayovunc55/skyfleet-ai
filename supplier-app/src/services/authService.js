import apiClient, {
  TOKEN_KEY,
  USER_KEY,
} from "./apiClient";

export async function login(
  loginValue,
  password,
) {
  const response =
    await apiClient.post(
      "/login",
      {
        login: loginValue,
        password,
      },
    );

  const data = response.data;

  if (
    !data?.token ||
    !data?.user
  ) {
    throw new Error(
      "Sunucudan geçersiz giriş cevabı alındı.",
    );
  }

  if (
    data.user.role !==
    "supplier"
  ) {
    throw new Error(
      "Bu hesap tedarikçi paneline giriş yetkisine sahip değil.",
    );
  }

  if (
    !data.user.supplier_id
  ) {
    throw new Error(
      "Tedarikçi hesabı bir şirkete bağlı değil.",
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

export async function requestPasswordReset(email) {
  const response = await apiClient.post(
    "/supplier-password/forgot",
    { email },
  );
  return response.data;
}

export async function resetPassword({ email, token, password, passwordConfirmation }) {
  const response = await apiClient.post(
    "/supplier-password/reset",
    {
      email,
      token,
      password,
      password_confirmation: passwordConfirmation,
    },
  );
  return response.data;
}

export async function logout() {
  try {
    await apiClient.post(
      "/logout",
    );
  } catch {
    /*
     * Sunucuya ulaşılamasa bile
     * yerel oturum temizlenir.
     */
  } finally {
    clearStoredAuth();
  }
}

export function clearStoredAuth() {
  localStorage.removeItem(
    TOKEN_KEY,
  );

  localStorage.removeItem(
    USER_KEY,
  );
}

export function getStoredUser() {
  const value =
    localStorage.getItem(
      USER_KEY,
    );

  if (!value) {
    return null;
  }

  try {
    const user =
      JSON.parse(value);

    if (
      user?.role !==
      "supplier"
    ) {
      clearStoredAuth();

      return null;
    }

    return user;
  } catch {
    clearStoredAuth();

    return null;
  }
}

export function getStoredToken() {
  return localStorage.getItem(
    TOKEN_KEY,
  );
}

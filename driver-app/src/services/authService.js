import apiClient, {
  TOKEN_KEY,
  USER_KEY,
} from "./apiClient";

export async function loginDriver({
  login,
  password,
}) {
  const response = await apiClient.post(
    "/login",
    {
      login,
      password,
    },
  );

  const token =
    response.data?.token ||
    response.data?.access_token;

  const user = response.data?.user;

  if (!token || !user) {
    throw new Error(
      "Giriş cevabında kullanıcı veya token bulunamadı.",
    );
  }

  if (user.role !== "driver") {
    throw new Error(
      "Bu uygulamaya yalnızca sürücüler giriş yapabilir.",
    );
  }

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify(user),
  );

  return user;
}

export async function resetDriverPassword({
  driverId,
  token,
  password,
  passwordConfirmation,
}) {
  const response = await apiClient.post(
    "/driver-password/reset",
    {
      driver_id: Number(driverId),
      token,
      password,
      password_confirmation:
        passwordConfirmation,
    },
  );

  return response.data;
}

export function getStoredDriver() {
  const rawUser =
    localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export async function logoutDriver() {
  try {
    await apiClient.post("/logout");
  } catch {
    // Yerel oturum yine de temizlenir.
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
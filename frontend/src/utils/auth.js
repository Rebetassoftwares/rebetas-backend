export function saveAuth(data) {
  if (data?.token) {
    localStorage.setItem("rebetas_token", data.token);
  }

  if (data?.user) {
    localStorage.setItem("rebetas_user", JSON.stringify(data.user));
  }
}

export function clearAuth() {
  localStorage.removeItem("rebetas_token");
  localStorage.removeItem("rebetas_user");
}

export function getStoredUser() {
  const raw = localStorage.getItem("rebetas_user");
  return raw ? JSON.parse(raw) : null;
}

export function getStoredToken() {
  return localStorage.getItem("rebetas_token");
}

// 🔥 UPDATED
export function isLoggedIn() {
  const token = getStoredToken();
  return !!token;
}

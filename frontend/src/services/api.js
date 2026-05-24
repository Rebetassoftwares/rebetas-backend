import { getStoredToken } from "../utils/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://rebetas-backend-production.up.railway.app/api";

async function request(endpoint, options = {}) {
  const token = getStoredToken();

  // 🔥 detect FormData
  const isFormData = options.body instanceof FormData;

  const headers = {
    // ✅ ONLY set JSON header if NOT FormData
    ...(!isFormData && options.body
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data = null;

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    console.error("API ERROR:", {
      status: response.status,
      data,
      endpoint,
    });

    // 🔥 HANDLE EXPIRED SESSION
    // BUT allow auth pages to receive backend errors normally
    if (
      response.status === 401 &&
      endpoint !== "/user/login" &&
      endpoint !== "/user/verify-login-otp" &&
      endpoint !== "/user/resend-login-otp"
    ) {
      localStorage.removeItem("rebetas_token");
      localStorage.removeItem("rebetas_user");

      window.location.href = "/login";

      throw new Error("Session expired. Please login again.");
    }

    throw new Error(
      data?.message || `Request failed with status ${response.status}`,
    );
  }

  return data;
}

const api = {
  get(endpoint, options = {}) {
    return request(endpoint, {
      method: "GET",
      ...options,
    });
  },

  post(endpoint, body) {
    return request(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  put(endpoint, body) {
    return request(endpoint, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  patch(endpoint, body) {
    return request(endpoint, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  delete(endpoint) {
    return request(endpoint, {
      method: "DELETE",
    });
  },
};

export default api;

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

    // 🔥 HANDLE INVALID SESSION
    if (response.status === 401) {
      localStorage.removeItem("rebetas_token");
      localStorage.removeItem("rebetas_user");

      window.location.href = "/login";
      return;
    }

    throw new Error(
      data?.message || `Request failed with status ${response.status}`,
    );
  }

  return data;
}

const api = {
  get(endpoint) {
    return request(endpoint, { method: "GET" });
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
    return request(endpoint, { method: "DELETE" });
  },
};

export default api;

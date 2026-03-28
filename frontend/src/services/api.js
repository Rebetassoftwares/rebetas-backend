const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://rebetas-backend-production.up.railway.app/api";

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("rebetas_token");

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
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
      body: JSON.stringify(body),
    });
  },
  put(endpoint, body) {
    return request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  patch(endpoint, body) {
    return request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
  delete(endpoint) {
    return request(endpoint, { method: "DELETE" });
  },
};

export default api;

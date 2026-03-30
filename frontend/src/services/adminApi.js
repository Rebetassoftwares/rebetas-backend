import api from "./api";

/* ---------------- AUTH HEADER ---------------- */

function authConfig() {
  const token = localStorage.getItem("rebetas_token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

/* ---------------- DASHBOARD ---------------- */

export const fetchDashboard = () =>
  api.get("/admin/analytics/dashboard", authConfig());

/* ---------------- PRICING ---------------- */

export const getPricing = () => api.get("/admin/pricing", authConfig());

export const createPricing = (data) =>
  api.post("/admin/pricing", data, authConfig());

export const updatePricing = (id, data) =>
  api.put(`/admin/pricing/${id}`, data, authConfig());

export const deletePricing = (id) =>
  api.delete(`/admin/pricing/${id}`, authConfig());

/* ---------------- PROMO CODES ---------------- */

export const getPromoCodes = () => api.get("/admin/promo", authConfig());

export const createPromoCode = (data) =>
  api.post("/admin/promo", data, authConfig());

export const updatePromoCode = (id, data) =>
  api.put(`/admin/promo/${id}`, data, authConfig());

export const deletePromoCode = (id) =>
  api.delete(`/admin/promo/${id}`, authConfig());

/* ---------------- PROMO DETAILS ---------------- */

export const getPromoDetails = (id) =>
  api.get(`/admin/promo/${id}`, authConfig());

/* ---------------- USERS ---------------- */

export const getUsers = () => api.get("/admin/users", authConfig());

export const deleteUser = (id) =>
  api.delete(`/admin/users/${id}`, authConfig());

export const resetUserDevice = (id) =>
  api.patch(`/admin/users/${id}/reset-device`, {}, authConfig());

// ✅ NEW
export const updateUserStatus = (id, status) =>
  api.patch(`/admin/users/${id}/status`, { status });

/* ---------------- PAYMENTS ---------------- */

export const getPayments = () => api.get("/admin/payments", authConfig());

/* ---------------- SUBSCRIPTIONS ---------------- */

export const getSubscriptions = () =>
  api.get("/admin/subscriptions", authConfig());

export const cancelSubscription = (id) =>
  api.patch(`/admin/subscriptions/${id}/cancel`, {}, authConfig());

/* ---------------- SYSTEM SETTINGS ---------------- */

export const getSettings = () => api.get("/admin/settings", authConfig());

export const updateSettings = (data) =>
  api.put("/admin/settings", data, authConfig());

export const resetCapital = (data) =>
  api.put("/admin/reset-capital", data, authConfig());

/* ================================
   💸 ADMIN WITHDRAWALS
================================ */

/* GET ALL WITHDRAWALS */
export const getAllWithdrawals = () => api.get("/admin/withdrawals");

/* PROCESS WITHDRAWAL (APPROVE / REJECT) */
export const processWithdrawal = (id, data) =>
  api.put(`/admin/withdrawals/${id}`, data);

/* ================================
   🟤 PLATFORMS
================================ */

export const getPlatforms = () => api.get("/platforms", authConfig());

export const getPlatformById = (id) =>
  api.get(`/platforms/${id}`, authConfig());

export const createPlatform = (data) =>
  api.post("/platforms", data, {
    ...authConfig(),
    headers: {
      ...authConfig().headers,
      "Content-Type": "multipart/form-data",
    },
  });

export const updatePlatform = (id, data) =>
  api.put(`/platforms/${id}`, data, {
    ...authConfig(),
    headers: {
      ...authConfig().headers,
      "Content-Type": "multipart/form-data",
    },
  });

export const deletePlatform = (id) =>
  api.delete(`/platforms/${id}`, authConfig());

export const getLeaguesByPlatform = (id) =>
  api.get(`/platforms/${id}/leagues`, authConfig());

/* ================================
   🟢 LEAGUES
================================ */

export const getLeagues = () => api.get("/manual-leagues", authConfig());

export const getLeagueById = (id) =>
  api.get(`/manual-leagues/${id}`, authConfig());

export const createLeague = (data) =>
  api.post("/manual-leagues", data, {
    ...authConfig(),
    headers: {
      ...authConfig().headers,
      "Content-Type": "multipart/form-data",
    },
  });

export const updateLeague = (id, data) =>
  api.put(`/manual-leagues/${id}`, data, {
    ...authConfig(),
    headers: {
      ...authConfig().headers,
      "Content-Type": "multipart/form-data",
    },
  });

/* ================================
   🔵 PREDICTIONS
================================ */

export const createManualPrediction = (data) =>
  api.post("/manual-predictions", data, authConfig());

export const getPredictionsByLeague = (leagueId) =>
  api.get(`/manual-predictions/league/${leagueId}`, authConfig());

export const updatePredictionResult = (id, data) =>
  api.put(`/manual-predictions/${id}/result`, data, authConfig());

export const getLivePredictions = () =>
  api.get("/manual-predictions/live", authConfig());

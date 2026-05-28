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
/* ---------------- USERS ---------------- */

export const getUsers = () => api.get("/admin/users", authConfig());

export const getUserById = (id) => api.get(`/admin/users/${id}`, authConfig());

export const deleteUser = (id) =>
  api.delete(`/admin/users/${id}`, authConfig());

export const resetUserDevice = (id) =>
  api.patch(`/admin/users/${id}/reset-device`, {}, authConfig());

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

/* ---------------- LEAGUE CAPITALS ---------------- */

/* GET ALL LEAGUE CAPITALS */
export const getLeagueCapitals = () =>
  api.get("/admin/league-capitals", authConfig());

/* RESET ALL LEAGUE CAPITALS */
export const resetAllLeagueCapitals = (data) =>
  api.put("/admin/league-capitals/reset", data, authConfig());

/* ================================
   💸 ADMIN WITHDRAWALS
================================ */

/* GET ALL WITHDRAWALS */
export const getAllWithdrawals = () => api.get("/admin/withdrawals");

/* PROCESS WITHDRAWAL (APPROVE / REJECT) */
export const processWithdrawal = (id, data) =>
  api.patch(`/admin/withdrawals/${id}/${data.action}`, data);

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

/* 🔥 BATCH UPDATE RESULTS */
export const updatePredictionResultsBatch = (updates) =>
  api.put("/manual-predictions/batch-result", updates, authConfig());

export const autoResolvePredictions = () =>
  api.post("/manual-predictions/auto-resolve", {}, authConfig());

/* ================================
   🚀 AUTOPILOT DASHBOARD
================================ */

export const getAutoPilotDashboard = () =>
  api.get("/admin/autopilot-dashboard", authConfig());

/* ================================
   📦 AUTOPILOT PACKAGES
================================ */

export const getAutoPilotPackages = () =>
  api.get("/admin/investment-packages", authConfig());

export const createAutoPilotPackage = (data) =>
  api.post("/admin/investment-packages", data);

export const updateAutoPilotPackage = (id, data) =>
  api.patch(`/admin/investment-packages/${id}`, data);

export const activateAutoPilotPackage = (id) =>
  api.patch(`/admin/investment-packages/${id}/activate`, {});

export const deactivateAutoPilotPackage = (id) =>
  api.patch(`/admin/investment-packages/${id}/deactivate`, {});

/* ================================
   👤 AUTOPILOT ACCOUNTS
================================ */

export const getAutoPilotAccounts = (params = {}) => {
  const query = new URLSearchParams(params).toString();

  return api.get(
    query ? `/admin/autopilot-accounts?${query}` : "/admin/autopilot-accounts",
    authConfig(),
  );
};

export const getAutoPilotAccountById = (id) =>
  api.get(`/admin/autopilot-accounts/${id}`, authConfig());

export const suspendAutoPilotAccount = (id) =>
  api.patch(`/admin/autopilot-accounts/${id}/suspend`, {});

export const reactivateAutoPilotAccount = (id) =>
  api.patch(`/admin/autopilot-accounts/${id}/reactivate`, {});

export const closeAutoPilotAccount = (id) =>
  api.patch(`/admin/autopilot-accounts/${id}/close`, {});

export const creditManualAutoPilotProfit = (id, data) =>
  api.post(`/admin/autopilot-manual-profit/${id}/credit`, data);

/* ================================
   🏦 AUTOPILOT WITHDRAWALS
================================ */

export const getAutoPilotWithdrawals = (params = {}) => {
  const query = new URLSearchParams(params).toString();

  return api.get(
    query
      ? `/admin/autopilot-withdrawals?${query}`
      : "/admin/autopilot-withdrawals",
    authConfig(),
  );
};

export const getAutoPilotWithdrawalById = (id) =>
  api.get(`/admin/autopilot-withdrawals/${id}`, authConfig());

export const getAutoPilotWithdrawalAudit = (id) =>
  api.get(`/admin/autopilot-withdrawals/${id}/audit`, authConfig());

export const approveAutoPilotWithdrawal = (id, data = {}) =>
  api.patch(`/admin/autopilot-withdrawals/${id}/approve`, data);

export const rejectAutoPilotWithdrawal = (id, data = {}) =>
  api.patch(`/admin/autopilot-withdrawals/${id}/reject`, data);

export const payAutoPilotWithdrawal = (id, data = {}) =>
  api.patch(`/admin/autopilot-withdrawals/${id}/pay`, data);

/* ================================
   🧾 AUTOPILOT TRANSACTIONS
================================ */

export const getAutoPilotTransactions = (params = {}) => {
  const query = new URLSearchParams(params).toString();

  return api.get(
    query
      ? `/admin/autopilot-transactions?${query}`
      : "/admin/autopilot-transactions",
    authConfig(),
  );
};

export const getAutoPilotTransactionById = (id) =>
  api.get(`/admin/autopilot-transactions/${id}`, authConfig());

/* ================================
   📈 AUTOPILOT ANALYTICS
================================ */

export const getAutoPilotAnalytics = (limit = 10) =>
  api.get(`/admin/autopilot-analytics?limit=${limit}`, authConfig());

/* ================================
   💜 AUTOPILOT DAILY PROFIT CREDIT
================================ */

export const applyDailyProfitCredit = () =>
  api.post("/admin/autopilot-daily-profit/credit", {});

/* ================================
   🌍 ADMIN CURRENCY RATES
================================ */

export const getCurrencyRates = (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.baseCurrency) params.append("baseCurrency", filters.baseCurrency);
  if (filters.targetCurrency)
    params.append("targetCurrency", filters.targetCurrency);
  if (filters.isActive !== "" && filters.isActive !== undefined) {
    params.append("isActive", filters.isActive);
  }

  const query = params.toString();

  return api.get(
    query ? `/admin/currency-rates?${query}` : "/admin/currency-rates",
    authConfig(),
  );
};

export const saveCurrencyRate = (payload) =>
  api.post("/admin/currency-rates", payload, authConfig());

export const updateCurrencyRateStatus = (id, isActive) =>
  api.patch(`/admin/currency-rates/${id}/status`, { isActive }, authConfig());

export const deleteCurrencyRate = (id) =>
  api.delete(`/admin/currency-rates/${id}`, authConfig());

export const getAdminNotifications = (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.userId) params.append("userId", filters.userId);
  if (filters.type) params.append("type", filters.type);
  if (filters.channel) params.append("channel", filters.channel);
  if (filters.isRead !== "" && filters.isRead !== undefined) {
    params.append("isRead", filters.isRead);
  }
  if (filters.page) params.append("page", filters.page);
  if (filters.limit) params.append("limit", filters.limit);

  const query = params.toString();

  return api.get(
    query ? `/admin/notifications?${query}` : "/admin/notifications",
  );
};

export const sendAdminUserNotification = (payload) =>
  api.post("/admin/notifications/send-user", payload);

export const deleteAdminNotification = (id) =>
  api.delete(`/admin/notifications/${id}`);

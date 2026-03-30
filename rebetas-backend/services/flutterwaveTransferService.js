const axios = require("axios");

const FLW_SECRET = process.env.FLUTTERWAVE_SECRET;
const FLW_SECRET_HASH = process.env.FLW_SECRET_HASH;

const flw = axios.create({
  baseURL: "https://api.flutterwave.com/v3",
  headers: {
    Authorization: `Bearer ${FLW_SECRET}`,
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

function ensureFlutterwaveConfig() {
  if (!FLW_SECRET) {
    throw new Error("FLUTTERWAVE_SECRET is not configured");
  }
}

function verifyFlutterwaveWebhook(req) {
  const signature = req.headers["verif-hash"];
  if (!FLW_SECRET_HASH) return false;
  if (!signature) return false;
  return signature === FLW_SECRET_HASH;
}

function normalizeTransferStatus(status = "") {
  const value = String(status).toUpperCase();

  if (value === "SUCCESSFUL") return "paid";
  if (value === "FAILED") return "failed";
  if (value === "NEW" || value === "PENDING") return "processing";

  return "processing";
}

function generateWithdrawalReference(withdrawalId, opts = {}) {
  const base = `REB_WD_${withdrawalId}_${Date.now()}`;
  if (opts.mockSuccess) return `${base}_PMCK`;
  if (opts.mockFailure) return `${base}_PMCK_ST_F`;
  return base;
}

async function getTransferFee({ amount, currency, type = "account" }) {
  ensureFlutterwaveConfig();

  const response = await flw.get("/transfers/fee", {
    params: {
      type,
      amount: Number(amount),
      currency,
    },
  });

  const fee = Number(response?.data?.data?.[0]?.fee || 0);

  return {
    raw: response.data,
    fee,
  };
}

async function initiateBankTransfer({
  amount,
  currency,
  reference,
  payoutDetails,
  narration,
  callbackUrl = "",
  debitCurrency = "",
  meta = {},
}) {
  ensureFlutterwaveConfig();

  const payload = {
    account_bank: payoutDetails.bankCode,
    account_number: payoutDetails.accountNumber,
    amount: Number(amount),
    currency,
    reference,
    narration,
    beneficiary_name: payoutDetails.accountName || undefined,
    callback_url: callbackUrl || undefined,
    debit_currency: debitCurrency || undefined,
    meta,
  };

  try {
    const response = await flw.post("/transfers", payload);
    return response.data;
  } catch (error) {
    console.error(
      "Flutterwave transfer error:",
      error.response?.data || error.message,
    );

    throw new Error(error.response?.data?.message || "Transfer failed");
  }
}

async function getTransferById(transferId) {
  ensureFlutterwaveConfig();

  const response = await flw.get(`/transfers/${transferId}`);
  return response.data;
}

module.exports = {
  verifyFlutterwaveWebhook,
  normalizeTransferStatus,
  generateWithdrawalReference,
  getTransferFee,
  initiateBankTransfer,
  getTransferById,
};

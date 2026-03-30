const PromoWithdrawal = require("../models/PromoWithdrawal");
const SystemSettings = require("../models/SystemSettings"); // ✅ ADD THIS
const {
  requestWithdrawal,
} = require("../services/withdrawalOrchestratorService");

/* ================================
   REQUEST WITHDRAWAL (USER)
================================ */
async function requestWithdrawalController(req, res) {
  try {
    const userId = req.user._id;
    const { currency, amount } = req.body;

    const normalizedCurrency = String(currency || "")
      .toUpperCase()
      .trim();

    /* ============================
       🔥 GET MIN WITHDRAWAL FROM SETTINGS
    ============================ */
    const settings = await SystemSettings.findOne().lean();

    const minMap = settings?.minWithdrawal || {};

    const minimumAmount =
      minMap[normalizedCurrency] ||
      (typeof minMap.get === "function"
        ? minMap.get(normalizedCurrency)
        : undefined) ||
      1;

    const withdrawal = await requestWithdrawal({
      userId,
      currency: normalizedCurrency,
      amount,
      minimumAmount, // ✅ dynamic now
    });

    res.status(201).json(withdrawal);
  } catch (error) {
    console.error("Withdrawal request error:", error.message);

    res.status(400).json({
      message: error.message || "Failed to request withdrawal",
    });
  }
}

/* ================================
   GET USER WITHDRAWALS
================================ */
async function getMyWithdrawals(req, res) {
  try {
    const userId = req.user._id;

    const withdrawals = await PromoWithdrawal.find({
      ownerId: userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(withdrawals);
  } catch (error) {
    console.error("Get withdrawals error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
}

module.exports = {
  requestWithdrawalController,
  getMyWithdrawals,
};

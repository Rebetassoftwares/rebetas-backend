const express = require("express");

const {
  requestWithdrawalController,
  getMyWithdrawals,
} = require("../controllers/promoWithdrawalController");

const { getTransferFee } = require("../services/flutterwaveTransferService");

// ✅ IMPORTANT: must point to your working middleware
const authenticateUser = require("../middleware/authenticateUser");

const router = express.Router();

/* ================================
   AUTH
================================ */
router.use(authenticateUser);

/* ================================
   🔥 PREVIEW WITHDRAWAL
================================ */
router.post("/preview", async (req, res) => {
  try {
    let { amount, currency } = req.body;

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({
        message: "Invalid amount",
      });
    }

    // ✅ normalize currency
    const normalizedCurrency = String(currency || "")
      .toUpperCase()
      .trim();

    if (!normalizedCurrency) {
      return res.status(400).json({
        message: "Currency is required",
      });
    }

    let fee = 0;

    try {
      // 🔥 Flutterwave fee (safe)
      const result = await getTransferFee({
        amount: numericAmount,
        currency: normalizedCurrency,
        type: "account",
      });

      fee = Number(result?.fee || 0);
    } catch (flwError) {
      // ✅ DO NOT crash preview if Flutterwave fails
      console.error("Flutterwave fee error:", flwError.message);
      fee = 0;
    }

    // 🔥 hidden markup (5%)
    const markup = Number((numericAmount * 0.05).toFixed(2));

    // 🔥 total fee shown to user (markup + real fee)
    const totalFee = Number((fee + markup).toFixed(2));

    // 🔥 what user actually receives
    const net = Number((numericAmount - totalFee).toFixed(2));

    return res.json({
      totalFee, // 👈 ONLY THIS is shown to user
      net,
    });
  } catch (err) {
    console.error("Preview error:", err.message);

    return res.status(500).json({
      message: "Failed to preview withdrawal",
    });
  }
});

/* ================================
   REQUEST WITHDRAWAL
================================ */
router.post("/", requestWithdrawalController);

/* ================================
   GET USER WITHDRAWALS
================================ */
router.get("/my", getMyWithdrawals);

module.exports = router;

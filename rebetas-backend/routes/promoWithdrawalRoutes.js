const express = require("express");
const {
  requestWithdrawalController,
  getMyWithdrawals,
} = require("../controllers/promoWithdrawalController");

const { getTransferFee } = require("../services/flutterwaveTransferService");

const auth = require("../middleware/auth");

const router = express.Router();

router.use(auth);

/* ================================
   🔥 PREVIEW WITHDRAWAL (NEW)
================================ */
router.post("/preview", async (req, res) => {
  try {
    const { amount, currency } = req.body;

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({
        message: "Invalid amount",
      });
    }

    // 🔥 real Flutterwave fee
    const { fee } = await getTransferFee({
      amount: numericAmount,
      currency,
      type: "account",
    });

    // 🔥 hidden markup (5%)
    const markup = Number((numericAmount * 0.05).toFixed(2));

    const totalFee = Number((fee + markup).toFixed(2));
    const net = Number((numericAmount - totalFee).toFixed(2));

    res.json({
      totalFee,
      net,
    });
  } catch (err) {
    console.error("Preview error:", err.message);

    res.status(500).json({
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

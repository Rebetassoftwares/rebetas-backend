const PromoWallet = require("../models/PromoWallet");
const PromoWithdrawal = require("../models/PromoWithdrawal");
const PayoutDetail = require("../models/PayoutDetail");

/* ================================
   REQUEST WITHDRAWAL (USER)
================================ */
async function requestWithdrawal(req, res) {
  try {
    const userId = req.user._id;

    const { currency, amount } = req.body;

    if (!currency || !amount) {
      return res.status(400).json({
        message: "currency and amount are required",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        message: "Invalid withdrawal amount",
      });
    }

    /* ============================
       CHECK PAYOUT DETAILS
    ============================ */
    const payout = await PayoutDetail.findOne({ ownerId: userId });

    if (!payout) {
      return res.status(400).json({
        message: "Please set your payment details before withdrawing",
      });
    }

    /* ============================
       GET WALLET
    ============================ */
    const wallet = await PromoWallet.findOne({
      ownerId: userId,
      currency: currency.toUpperCase(),
    });

    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found",
      });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({
        message: "Insufficient balance",
      });
    }

    /* ============================
       MOVE FUNDS TO PENDING
    ============================ */
    wallet.balance -= amount;
    wallet.pendingBalance += amount;

    await wallet.save();

    /* ============================
       CREATE WITHDRAWAL
    ============================ */
    const withdrawal = await PromoWithdrawal.create({
      ownerId: userId,
      walletId: wallet._id,
      currency: wallet.currency,
      amount,

      // 🔥 SNAPSHOT FROM DB (NOT FRONTEND)
      payoutDetails: {
        accountName: payout.accountName,
        accountNumber: payout.accountNumber,
        bankName: payout.bankName,
        bankCode: payout.bankCode,
      },
    });

    res.status(201).json(withdrawal);
  } catch (error) {
    console.error("Withdrawal request error:", error.message);

    res.status(500).json({
      message: "Server error",
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
  requestWithdrawal,
  getMyWithdrawals,
};

const PromoWithdrawal = require("../models/PromoWithdrawal");
const PromoWallet = require("../models/PromoWallet");

/* ================================
   GET ALL WITHDRAWALS (ADMIN)
================================ */
async function getAllWithdrawals(req, res) {
  try {
    const withdrawals = await PromoWithdrawal.find({})
      .populate("ownerId", "fullName email username")
      .sort({ createdAt: -1 })
      .lean();

    res.json(withdrawals);
  } catch (error) {
    console.error("Admin withdrawals error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
}

/* ================================
   PROCESS WITHDRAWAL (ADMIN)
================================ */
async function processWithdrawal(req, res) {
  try {
    const { id } = req.params;
    const { action, adminNote } = req.body;

    const withdrawal = await PromoWithdrawal.findById(id);

    if (!withdrawal) {
      return res.status(404).json({
        message: "Withdrawal not found",
      });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({
        message: "Already processed",
      });
    }

    const wallet = await PromoWallet.findById(withdrawal.walletId);

    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found",
      });
    }

    if (action === "approve") {
      wallet.pendingBalance -= withdrawal.amount;
      wallet.totalWithdrawn += withdrawal.amount;

      withdrawal.status = "approved";
    } else if (action === "reject") {
      wallet.pendingBalance -= withdrawal.amount;
      wallet.balance += withdrawal.amount;

      withdrawal.status = "rejected";
    } else {
      return res.status(400).json({
        message: "Invalid action",
      });
    }

    withdrawal.adminNote = adminNote || "";
    withdrawal.processedBy = req.user._id;
    withdrawal.processedAt = new Date();

    await wallet.save();
    await withdrawal.save();

    res.json(withdrawal);
  } catch (error) {
    console.error("Process withdrawal error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
}

module.exports = {
  getAllWithdrawals,
  processWithdrawal,
};

const PromoWithdrawal = require("../models/PromoWithdrawal");
const WithdrawalAuditLog = require("../models/WithdrawalAuditLog");
const User = require("../models/User");
const {
  approveWithdrawal,
  rejectWithdrawal,
  payWithdrawal,
} = require("../services/withdrawalOrchestratorService");

/* ================================
   GET ALL WITHDRAWALS (ADMIN)
================================ */
async function getAllWithdrawals(req, res) {
  try {
    const withdrawals = await PromoWithdrawal.find({})
      .sort({ createdAt: -1 })
      .lean();

    const userIds = [
      ...new Set(withdrawals.map((w) => w.ownerId?.toString()).filter(Boolean)),
    ];

    const users = await User.find({
      _id: { $in: userIds },
    })
      .select("fullName email username")
      .lean();

    const userMap = {};
    users.forEach((user) => {
      userMap[user._id.toString()] = user;
    });

    const enriched = withdrawals.map((withdrawal) => ({
      ...withdrawal,
      owner: userMap[withdrawal.ownerId?.toString()] || null,
    }));

    res.json(enriched);
  } catch (error) {
    console.error("Admin withdrawals error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
}

/* ================================
   APPROVE WITHDRAWAL
================================ */
async function approveWithdrawalController(req, res) {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    const withdrawal = await approveWithdrawal({
      withdrawalId: id,
      adminId: req.user._id,
      adminNote,
    });

    res.json(withdrawal);
  } catch (error) {
    console.error("Approve withdrawal error:", error.message);

    res.status(400).json({
      message: error.message || "Failed to approve withdrawal",
    });
  }
}

/* ================================
   REJECT WITHDRAWAL
================================ */
async function rejectWithdrawalController(req, res) {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    const withdrawal = await rejectWithdrawal({
      withdrawalId: id,
      adminId: req.user._id,
      adminNote,
    });

    res.json(withdrawal);
  } catch (error) {
    console.error("Reject withdrawal error:", error.message);

    res.status(400).json({
      message: error.message || "Failed to reject withdrawal",
    });
  }
}

/* ================================
   PAY WITHDRAWAL
================================ */
async function payWithdrawalController(req, res) {
  try {
    const { id } = req.params;
    const { adminNote, mockSuccess, mockFailure } = req.body;

    const withdrawal = await payWithdrawal({
      withdrawalId: id,
      adminId: req.user._id,
      adminNote,
      mockSuccess: !!mockSuccess,
      mockFailure: !!mockFailure,
    });

    res.json(withdrawal);
  } catch (error) {
    console.error("Pay withdrawal error:", error.message);

    res.status(400).json({
      message: error.message || "Failed to initiate payout",
    });
  }
}

/* ================================
   GET AUDIT LOGS
================================ */
async function getWithdrawalAuditLogs(req, res) {
  try {
    const { id } = req.params;

    const logs = await WithdrawalAuditLog.find({
      withdrawalId: id,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(logs);
  } catch (error) {
    console.error("Withdrawal audit logs error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
}

module.exports = {
  getAllWithdrawals,
  approveWithdrawalController,
  rejectWithdrawalController,
  payWithdrawalController,
  getWithdrawalAuditLogs,
};

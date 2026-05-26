const InvestmentWithdrawal = require("../models/InvestmentWithdrawal");
const InvestmentWithdrawalAuditLog = require("../models/InvestmentWithdrawalAuditLog");
const User = require("../models/User");

const {
  approveWithdrawal,
  rejectWithdrawal,
  payWithdrawal,
} = require("../services/autoPilotWithdrawalService");

async function getAllWithdrawals(req, res) {
  try {
    const { status, type, userId } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (type) {
      filter.withdrawalType = type;
    }

    if (userId) {
      filter.userId = userId;
    }

    const withdrawals = await InvestmentWithdrawal.find(filter)
      .sort({ createdAt: -1 })
      .populate("investmentAccountId")
      .populate("payoutDetailId")
      .lean();

    const userIds = [
      ...new Set(
        withdrawals.map((item) => item.userId?.toString()).filter(Boolean),
      ),
    ];

    const users = await User.find({
      _id: { $in: userIds },
    })
      .select("fullName email username phone country")
      .lean();

    const userMap = {};

    users.forEach((user) => {
      userMap[user._id.toString()] = user;
    });

    const enrichedWithdrawals = withdrawals.map((withdrawal) => ({
      ...withdrawal,
      user: userMap[withdrawal.userId?.toString()] || null,
    }));

    return res.status(200).json({
      success: true,
      data: enrichedWithdrawals,
    });
  } catch (error) {
    console.error("Get AutoPilot Withdrawals error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch AutoPilot Withdrawals",
    });
  }
}

async function getWithdrawalById(req, res) {
  try {
    const withdrawal = await InvestmentWithdrawal.findById(req.params.id)
      .populate("investmentAccountId")
      .populate("payoutDetailId")
      .lean();

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal request not found",
      });
    }

    const user = await User.findById(withdrawal.userId)
      .select("fullName email username phone country")
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        ...withdrawal,
        user,
      },
    });
  } catch (error) {
    console.error("Get AutoPilot Withdrawal error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch withdrawal request",
    });
  }
}

async function approveWithdrawalController(req, res) {
  try {
    const withdrawal = await approveWithdrawal({
      withdrawalId: req.params.id,
      adminId: req.user._id,
      adminNote: req.body.adminNote,
    });

    return res.status(200).json({
      success: true,
      message:
        withdrawal.withdrawalType === "capital"
          ? "Capital Withdrawal approved successfully"
          : "Profit Withdrawal approved successfully",
      data: withdrawal,
    });
  } catch (error) {
    console.error("Approve AutoPilot Withdrawal error:", error.message);

    return res.status(400).json({
      success: false,
      message:
        error.message || "Failed to approve AutoPilot Withdrawal request",
    });
  }
}

async function rejectWithdrawalController(req, res) {
  try {
    const withdrawal = await rejectWithdrawal({
      withdrawalId: req.params.id,
      adminId: req.user._id,
      adminNote: req.body.adminNote,
    });

    return res.status(200).json({
      success: true,
      message:
        withdrawal.withdrawalType === "capital"
          ? "Capital Withdrawal rejected successfully"
          : "Profit Withdrawal rejected successfully",
      data: withdrawal,
    });
  } catch (error) {
    console.error("Reject AutoPilot Withdrawal error:", error.message);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to reject AutoPilot Withdrawal request",
    });
  }
}

async function payWithdrawalController(req, res) {
  try {
    const withdrawal = await payWithdrawal({
      withdrawalId: req.params.id,
      adminId: req.user._id,
      adminNote: req.body.adminNote,
      mockSuccess: !!req.body.mockSuccess,
      mockFailure: !!req.body.mockFailure,
    });

    return res.status(200).json({
      success: true,
      message:
        withdrawal.status === "successful"
          ? withdrawal.withdrawalType === "capital"
            ? "Capital Withdrawal payout completed successfully"
            : "Profit Withdrawal payout completed successfully"
          : withdrawal.status === "processing"
            ? withdrawal.withdrawalType === "capital"
              ? "Capital Withdrawal payout is processing"
              : "Profit Withdrawal payout is processing"
            : withdrawal.withdrawalType === "capital"
              ? "Capital Withdrawal payout failed"
              : "Profit Withdrawal payout failed",
      data: withdrawal,
    });
  } catch (error) {
    console.error("Pay AutoPilot Withdrawal error:", error.message);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to process AutoPilot Withdrawal payout",
    });
  }
}

async function getWithdrawalAuditLogs(req, res) {
  try {
    const logs = await InvestmentWithdrawalAuditLog.find({
      withdrawalId: req.params.id,
    })
      .sort({ createdAt: -1 })
      .populate("actorId", "fullName email username role")
      .lean();

    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error("AutoPilot Withdrawal audit error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch AutoPilot Withdrawal audit logs",
    });
  }
}

module.exports = {
  getAllWithdrawals,
  getWithdrawalById,
  approveWithdrawalController,
  rejectWithdrawalController,
  payWithdrawalController,
  getWithdrawalAuditLogs,
};

const InvestmentAccount = require("../models/InvestmentAccount");
const InvestmentTransaction = require("../models/InvestmentTransaction");
const InvestmentWithdrawal = require("../models/InvestmentWithdrawal");
const User = require("../models/User");

async function getAllAccounts(req, res) {
  try {
    const { status, packageId, userId } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (packageId) filter.packageId = packageId;
    if (userId) filter.userId = userId;

    const accounts = await InvestmentAccount.find(filter)
      .sort({ createdAt: -1 })
      .populate("packageId")
      .lean();

    const userIds = [
      ...new Set(
        accounts.map((account) => account.userId?.toString()).filter(Boolean),
      ),
    ];

    const users = await User.find({
      _id: { $in: userIds },
    })
      .select("fullName username email phone country role")
      .lean();

    const userMap = {};

    users.forEach((user) => {
      userMap[user._id.toString()] = user;
    });

    const enrichedAccounts = accounts.map((account) => ({
      ...account,
      user: userMap[account.userId?.toString()] || null,
    }));

    return res.status(200).json({
      success: true,
      data: enrichedAccounts,
    });
  } catch (error) {
    console.error("Get AutoPilot accounts error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch AutoPilot accounts",
    });
  }
}

async function getAccountById(req, res) {
  try {
    const account = await InvestmentAccount.findById(req.params.id)
      .populate("packageId")
      .lean();

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "AutoPilot account not found",
      });
    }

    const user = await User.findById(account.userId)
      .select("fullName username email phone country accountStatus role")
      .lean();

    const recentTransactions = await InvestmentTransaction.find({
      investmentAccountId: account._id,
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const recentWithdrawals = await InvestmentWithdrawal.find({
      investmentAccountId: account._id,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        account,
        user,
        recentTransactions,
        recentWithdrawals,
      },
    });
  } catch (error) {
    console.error("Get AutoPilot account error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch AutoPilot account",
    });
  }
}

async function suspendAccount(req, res) {
  try {
    const account = await InvestmentAccount.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "AutoPilot account not found",
      });
    }

    if (account.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "Closed AutoPilot accounts cannot be suspended",
      });
    }

    account.status = "suspended";

    await account.save();

    return res.status(200).json({
      success: true,
      message: "AutoPilot account suspended successfully",
      data: account,
    });
  } catch (error) {
    console.error("Suspend AutoPilot account error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to suspend AutoPilot account",
    });
  }
}

async function reactivateAccount(req, res) {
  try {
    const account = await InvestmentAccount.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "AutoPilot account not found",
      });
    }

    if (account.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "Closed AutoPilot accounts cannot be reactivated",
      });
    }

    account.status = "active";

    await account.save();

    return res.status(200).json({
      success: true,
      message: "AutoPilot account reactivated successfully",
      data: account,
    });
  } catch (error) {
    console.error("Reactivate AutoPilot account error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to reactivate AutoPilot account",
    });
  }
}

async function closeAccount(req, res) {
  try {
    const account = await InvestmentAccount.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "AutoPilot account not found",
      });
    }

    const activeWithdrawal = await InvestmentWithdrawal.findOne({
      investmentAccountId: account._id,
      status: { $in: ["pending", "approved", "processing"] },
    });

    if (activeWithdrawal) {
      return res.status(400).json({
        success: false,
        message: "This AutoPilot account has a pending withdrawal request",
      });
    }

    account.status = "closed";

    await account.save();

    return res.status(200).json({
      success: true,
      message: "AutoPilot account closed successfully",
      data: account,
    });
  } catch (error) {
    console.error("Close AutoPilot account error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to close AutoPilot account",
    });
  }
}

module.exports = {
  getAllAccounts,
  getAccountById,
  suspendAccount,
  reactivateAccount,
  closeAccount,
};

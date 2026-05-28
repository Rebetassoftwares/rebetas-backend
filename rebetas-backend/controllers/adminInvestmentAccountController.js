const InvestmentAccount = require("../models/InvestmentAccount");
const InvestmentTransaction = require("../models/InvestmentTransaction");
const InvestmentWithdrawal = require("../models/InvestmentWithdrawal");
const User = require("../models/User");

const BASE_CURRENCY = "USD";

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function normalizeCurrency(currency) {
  return String(currency || BASE_CURRENCY)
    .trim()
    .toUpperCase();
}

function toBaseAmount(amount, currency, exchangeRateSnapshot) {
  const numericAmount = Number(amount || 0);
  const normalizedCurrency = normalizeCurrency(currency);

  if (!numericAmount) return 0;

  if (normalizedCurrency === BASE_CURRENCY) {
    return roundMoney(numericAmount);
  }

  const rate = Number(exchangeRateSnapshot || 0);

  if (!rate || rate <= 0) {
    return 0;
  }

  return roundMoney(numericAmount / rate);
}

function enrichAccountForAdmin(account) {
  const currency = normalizeCurrency(account.currency);
  const exchangeRateSnapshot =
    currency === BASE_CURRENCY ? 1 : Number(account.exchangeRateSnapshot || 0);

  return {
    ...account,

    localCurrency: currency,
    baseCurrency: BASE_CURRENCY,

    basePackageAmountSnapshot:
      Number(account.basePackageAmountSnapshot || 0) ||
      toBaseAmount(
        account.packageAmountSnapshot,
        currency,
        exchangeRateSnapshot,
      ),

    baseCapitalBalance: toBaseAmount(
      account.capitalBalance,
      currency,
      exchangeRateSnapshot,
    ),

    baseProfitBalance: toBaseAmount(
      account.profitBalance,
      currency,
      exchangeRateSnapshot,
    ),

    baseTotalProfitEarned: toBaseAmount(
      account.totalProfitEarned,
      currency,
      exchangeRateSnapshot,
    ),

    baseTotalProfitWithdrawn: toBaseAmount(
      account.totalProfitWithdrawn,
      currency,
      exchangeRateSnapshot,
    ),

    baseTotalCapitalWithdrawn: toBaseAmount(
      account.totalCapitalWithdrawn,
      currency,
      exchangeRateSnapshot,
    ),

    exchangeRateSnapshot,
    hasValidExchangeRate:
      currency === BASE_CURRENCY || Boolean(exchangeRateSnapshot),
  };
}

function enrichTransactionForAdmin(transaction, account) {
  const currency = normalizeCurrency(transaction.currency || account?.currency);
  const exchangeRateSnapshot =
    Number(transaction.exchangeRateSnapshot || account?.exchangeRateSnapshot) ||
    (currency === BASE_CURRENCY ? 1 : 0);

  return {
    ...transaction,

    localCurrency: currency,
    baseCurrency: transaction.baseCurrency || BASE_CURRENCY,

    baseAmount:
      Number(transaction.baseAmount || 0) ||
      toBaseAmount(transaction.amount, currency, exchangeRateSnapshot),

    exchangeRateSnapshot,
  };
}

function enrichWithdrawalForAdmin(withdrawal, account) {
  const currency = normalizeCurrency(withdrawal.currency || account?.currency);
  const exchangeRateSnapshot =
    Number(withdrawal.exchangeRateSnapshot || account?.exchangeRateSnapshot) ||
    (currency === BASE_CURRENCY ? 1 : 0);

  return {
    ...withdrawal,

    localCurrency: currency,
    baseCurrency: withdrawal.baseCurrency || BASE_CURRENCY,

    baseAmount:
      Number(withdrawal.baseAmount || 0) ||
      toBaseAmount(withdrawal.amount, currency, exchangeRateSnapshot),

    baseNetAmount:
      Number(withdrawal.baseNetAmount || 0) ||
      toBaseAmount(withdrawal.netAmount, currency, exchangeRateSnapshot),

    baseFeeAmount:
      Number(withdrawal.baseFeeAmount || 0) ||
      toBaseAmount(withdrawal.feeAmount, currency, exchangeRateSnapshot),

    exchangeRateSnapshot,
  };
}

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

    const enrichedAccounts = accounts.map((account) =>
      enrichAccountForAdmin({
        ...account,
        user: userMap[account.userId?.toString()] || null,
      }),
    );

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

    const [recentTransactions, recentWithdrawals] = await Promise.all([
      InvestmentTransaction.find({
        investmentAccountId: account._id,
      })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),

      InvestmentWithdrawal.find({
        investmentAccountId: account._id,
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    const enrichedAccount = enrichAccountForAdmin(account);

    return res.status(200).json({
      success: true,
      data: {
        account: enrichedAccount,
        user,
        recentTransactions: recentTransactions.map((transaction) =>
          enrichTransactionForAdmin(transaction, enrichedAccount),
        ),
        recentWithdrawals: recentWithdrawals.map((withdrawal) =>
          enrichWithdrawalForAdmin(withdrawal, enrichedAccount),
        ),
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
      data: enrichAccountForAdmin(account.toObject()),
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
      data: enrichAccountForAdmin(account.toObject()),
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
      data: enrichAccountForAdmin(account.toObject()),
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

const mongoose = require("mongoose");

const InvestmentPackage = require("../models/InvestmentPackage");
const InvestmentAccount = require("../models/InvestmentAccount");
const InvestmentTransaction = require("../models/InvestmentTransaction");
const InvestmentWithdrawal = require("../models/InvestmentWithdrawal");
const User = require("../models/User");
const Referral = require("../models/Referral");
const ReferralBonus = require("../models/ReferralBonus");

const PayoutDetail = require("../models/PayoutDetail");

const {
  convertFromBaseCurrency,
} = require("../services/currencyConversionService");

const {
  sendAutoPilotNotification,
} = require("../services/notificationService");

const BASE_CURRENCY = "USD";

const getUserId = (req) => req.user?._id || req.user?.id;

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function normalizeCurrency(currency) {
  return String(currency || BASE_CURRENCY)
    .trim()
    .toUpperCase();
}

function toUsd(amount, currency, exchangeRateSnapshot) {
  const numericAmount = Number(amount || 0);
  const normalizedCurrency = normalizeCurrency(currency);

  if (!numericAmount) return 0;
  if (normalizedCurrency === BASE_CURRENCY) return roundMoney(numericAmount);

  const rate = Number(exchangeRateSnapshot || 0);

  if (!rate || rate <= 0) {
    throw new Error(
      "Exchange rate snapshot is missing for this AutoPilot account",
    );
  }

  return roundMoney(numericAmount / rate);
}

exports.getPackages = async (req, res) => {
  try {
    const userCurrency = normalizeCurrency(req.user?.currency);

    const packages = await InvestmentPackage.find({
      isActive: true,
    })
      .sort({
        sortOrder: 1,
        amount: 1,
      })
      .lean();

    const localizedPackages = await Promise.all(
      packages.map(async (item) => {
        const baseCurrency = normalizeCurrency(item.currency || BASE_CURRENCY);

        const converted = await convertFromBaseCurrency({
          amount: item.amount,
          baseCurrency,
          targetCurrency: userCurrency,
        });

        return {
          ...item,

          // user/local display
          amount: converted.targetAmount,
          currency: converted.targetCurrency,

          // admin/USD value
          baseAmount: converted.baseAmount,
          baseCurrency: converted.baseCurrency,
          exchangeRateSnapshot: converted.exchangeRate,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      data: localizedPackages,
    });
  } catch (error) {
    console.error("Get AutoPilot Packages error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch AutoPilot Packages",
    });
  }
};

exports.getMyInvestment = async (req, res) => {
  try {
    const account = await InvestmentAccount.findOne({
      userId: getUserId(req),
      status: "active",
    }).populate("packageId");

    return res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.error("Get AutoPilot account error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch AutoPilot account",
    });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const userId = getUserId(req);

    const account = await InvestmentAccount.findOne({
      userId,
      status: "active",
    });

    const user = await User.findById(userId)
      .select("referralCode referralBalance totalReferralEarned currency")
      .lean();

    const payoutDetails = await PayoutDetail.findOne({
      ownerId: userId,
      isActive: true,
    });

    const recentTransactions = await InvestmentTransaction.find({
      userId,
    })
      .sort({ createdAt: -1 })
      .limit(20);

    const referralCode = user?.referralCode || null;

    return res.status(200).json({
      success: true,
      data: {
        account,
        payoutDetails,
        recentTransactions,

        referral: {
          referralCode,

          referralLink: referralCode
            ? `${process.env.CLIENT_URL}/register?ref=${encodeURIComponent(
                referralCode,
              )}`
            : null,

          referralBalance: user?.referralBalance || 0,
          totalReferralEarned: user?.totalReferralEarned || 0,
          currency: user?.currency || account?.currency || "USD",
        },
      },
    });
  } catch (error) {
    console.error("AutoPilot Dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch AutoPilot Dashboard",
    });
  }
};

exports.compoundProfit = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const userId = getUserId(req);
    const amount = Number(req.body.amount);

    if (!amount || amount <= 0) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Invalid Compound Profit amount",
      });
    }

    const account = await InvestmentAccount.findOne({
      userId,
      status: "active",
    }).session(session);

    if (!account) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "AutoPilot account not found",
      });
    }

    if (Number(account.profitBalance || 0) < amount) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Insufficient Profit Balance",
      });
    }

    const currency = normalizeCurrency(account.currency);
    const exchangeRateSnapshot =
      currency === BASE_CURRENCY
        ? 1
        : Number(account.exchangeRateSnapshot || 0);

    const baseAmount = toUsd(amount, currency, exchangeRateSnapshot);

    const beforeCapital = Number(account.capitalBalance || 0);
    const beforeProfit = Number(account.profitBalance || 0);

    account.profitBalance = roundMoney(beforeProfit - amount);
    account.capitalBalance = roundMoney(beforeCapital + amount);
    account.lastReinvestDate = new Date();
    account.capitalWithdrawAvailableAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    );

    await account.save({ session });

    await InvestmentTransaction.create(
      [
        {
          userId,
          investmentAccountId: account._id,
          type: "profit_reinvest",
          status: "successful",

          amount,
          currency,

          baseAmount,
          baseCurrency: BASE_CURRENCY,
          exchangeRateSnapshot,

          balanceBefore: {
            capitalBalance: beforeCapital,
            profitBalance: beforeProfit,
          },
          balanceAfter: {
            capitalBalance: account.capitalBalance,
            profitBalance: account.profitBalance,
          },
          description:
            "Compound Profit moved from Profit Balance to Capital Balance",
        },
      ],
      { session },
    );

    await session.commitTransaction();

    await sendAutoPilotNotification({
      event: "COMPOUND_PROFIT",
      user: req.user,
      data: {
        amount,
        currency,
      },
      metadata: {
        investmentAccountId: account._id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Compound Profit completed successfully",
      data: account,
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Compound Profit error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to complete Compound Profit",
    });
  } finally {
    session.endSession();
  }
};

exports.compoundReferral = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const userId = getUserId(req);
    const amount = Number(req.body.amount);

    if (!amount || amount <= 0) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Invalid Referral Compound amount",
      });
    }

    const user = await User.findById(userId).session(session);

    if (!user) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const account = await InvestmentAccount.findOne({
      userId,
      status: "active",
    }).session(session);

    if (!account) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "AutoPilot account not found",
      });
    }

    if (Number(user.referralBalance || 0) < amount) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Insufficient Referral Balance",
      });
    }

    const currency = normalizeCurrency(account.currency);

    const exchangeRateSnapshot =
      currency === BASE_CURRENCY
        ? 1
        : Number(account.exchangeRateSnapshot || 0);

    const baseAmount = toUsd(amount, currency, exchangeRateSnapshot);

    const beforeCapital = Number(account.capitalBalance || 0);
    const beforeReferral = Number(user.referralBalance || 0);

    user.referralBalance = roundMoney(beforeReferral - amount);

    account.capitalBalance = roundMoney(beforeCapital + amount);

    account.lastReinvestDate = new Date();

    account.capitalWithdrawAvailableAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    );

    await user.save({ session });
    await account.save({ session });

    await InvestmentTransaction.create(
      [
        {
          userId,
          investmentAccountId: account._id,

          type: "referral_compound",
          status: "successful",

          amount,
          currency,

          baseAmount,
          baseCurrency: BASE_CURRENCY,
          exchangeRateSnapshot,

          balanceBefore: {
            capitalBalance: beforeCapital,
            profitBalance: null,
          },

          balanceAfter: {
            capitalBalance: account.capitalBalance,
            profitBalance: null,
          },

          metadata: {
            referralBalanceBefore: beforeReferral,
            referralBalanceAfter: user.referralBalance,
          },

          description: "Referral Balance compounded into Capital Balance",
        },
      ],
      { session },
    );

    await session.commitTransaction();

    await sendAutoPilotNotification({
      event: "COMPOUND_REFERRAL",
      user: req.user,
      data: {
        amount,
        currency,
      },
      metadata: {
        investmentAccountId: account._id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Referral Balance compounded successfully",
      data: {
        referralBalance: user.referralBalance,
        capitalBalance: account.capitalBalance,
      },
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Compound Referral error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to compound Referral Balance",
    });
  } finally {
    session.endSession();
  }
};

exports.withdrawProfit = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const userId = getUserId(req);
    const amount = Number(req.body.amount);

    if (!amount || amount <= 0) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Invalid Profit Withdrawal amount",
      });
    }

    const account = await InvestmentAccount.findOne({
      userId,
      status: "active",
    }).session(session);

    if (!account) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "AutoPilot account not found",
      });
    }

    const existingPendingWithdrawal = await InvestmentWithdrawal.findOne({
      userId,
      investmentAccountId: account._id,
      withdrawalType: "profit",
      status: { $in: ["pending", "approved", "processing"] },
    }).session(session);

    if (existingPendingWithdrawal) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "You already have a Profit Withdrawal under review",
      });
    }

    if (Number(account.profitBalance || 0) < amount) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Insufficient Profit Balance",
      });
    }

    const payoutDetails = await PayoutDetail.findOne({
      ownerId: userId,
      isActive: true,
    }).session(session);

    if (!payoutDetails) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Please add payout details first",
      });
    }

    const currency = normalizeCurrency(account.currency);
    const exchangeRateSnapshot =
      currency === BASE_CURRENCY
        ? 1
        : Number(account.exchangeRateSnapshot || 0);

    const baseAmount = toUsd(amount, currency, exchangeRateSnapshot);

    const beforeCapital = Number(account.capitalBalance || 0);
    const beforeProfit = Number(account.profitBalance || 0);

    account.profitBalance = roundMoney(beforeProfit - amount);

    await account.save({ session });

    const transaction = await InvestmentTransaction.create(
      [
        {
          userId,
          investmentAccountId: account._id,
          type: "profit_withdrawal",
          status: "pending",

          amount,
          currency,

          baseAmount,
          baseCurrency: BASE_CURRENCY,
          exchangeRateSnapshot,

          balanceBefore: {
            capitalBalance: beforeCapital,
            profitBalance: beforeProfit,
          },
          balanceAfter: {
            capitalBalance: account.capitalBalance,
            profitBalance: account.profitBalance,
          },
          description: "Profit Withdrawal request submitted",
        },
      ],
      { session },
    );

    const withdrawal = await InvestmentWithdrawal.create(
      [
        {
          userId,
          investmentAccountId: account._id,
          transactionId: transaction[0]._id,
          withdrawalType: "profit",

          amount,
          netAmount: 0,
          feeAmount: 0,
          feePolicy: "user_pays",
          currency,

          baseAmount,
          baseNetAmount: 0,
          baseFeeAmount: 0,
          baseCurrency: BASE_CURRENCY,
          exchangeRateSnapshot,

          payoutDetailId: payoutDetails._id,
          payoutDetails: {
            accountName: payoutDetails.accountName,
            accountNumber: payoutDetails.accountNumber,
            bankName: payoutDetails.bankName,
            bankCode: payoutDetails.bankCode,
          },
          status: "pending",
        },
      ],
      { session },
    );

    await session.commitTransaction();

    await sendAutoPilotNotification({
      event: "PROFIT_WITHDRAWAL_REQUESTED",
      user: req.user,
      data: {
        amount,
        currency,
        withdrawalType: "Profit Withdrawal",
      },
      metadata: {
        withdrawalId: withdrawal[0]._id,
        transactionId: transaction[0]._id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Profit Withdrawal request submitted for review",
      data: withdrawal[0],
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Profit Withdrawal error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit Profit Withdrawal request",
    });
  } finally {
    session.endSession();
  }
};

exports.withdrawReferral = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const userId = getUserId(req);
    const amount = Number(req.body.amount);

    if (!amount || amount <= 0) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Invalid Referral Withdrawal amount",
      });
    }

    const user = await User.findById(userId).session(session);

    if (!user) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const account = await InvestmentAccount.findOne({
      userId,
      status: "active",
    }).session(session);

    if (!account) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "AutoPilot account not found",
      });
    }

    const existingPendingWithdrawal = await InvestmentWithdrawal.findOne({
      userId,
      investmentAccountId: account._id,
      withdrawalType: "referral",
      status: {
        $in: ["pending", "approved", "processing"],
      },
    }).session(session);

    if (existingPendingWithdrawal) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "You already have a Referral Withdrawal under review",
      });
    }

    if (Number(user.referralBalance || 0) < amount) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Insufficient Referral Balance",
      });
    }

    const payoutDetails = await PayoutDetail.findOne({
      ownerId: userId,
      isActive: true,
    }).session(session);

    if (!payoutDetails) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Please add payout details first",
      });
    }

    const currency = normalizeCurrency(account.currency);

    const exchangeRateSnapshot =
      currency === BASE_CURRENCY
        ? 1
        : Number(account.exchangeRateSnapshot || 0);

    const baseAmount = toUsd(amount, currency, exchangeRateSnapshot);

    const beforeReferral = Number(user.referralBalance || 0);

    user.referralBalance = roundMoney(beforeReferral - amount);

    await user.save({ session });

    const transaction = await InvestmentTransaction.create(
      [
        {
          userId,
          investmentAccountId: account._id,

          type: "referral_withdrawal",
          status: "pending",

          amount,
          currency,

          baseAmount,
          baseCurrency: BASE_CURRENCY,
          exchangeRateSnapshot,

          metadata: {
            referralBalanceBefore: beforeReferral,
            referralBalanceAfter: user.referralBalance,
          },

          description: "Referral Withdrawal request submitted",
        },
      ],
      { session },
    );

    const withdrawal = await InvestmentWithdrawal.create(
      [
        {
          userId,
          investmentAccountId: account._id,
          transactionId: transaction[0]._id,

          withdrawalType: "referral",

          amount,
          netAmount: 0,
          feeAmount: 0,
          feePolicy: "user_pays",

          currency,

          baseAmount,
          baseNetAmount: 0,
          baseFeeAmount: 0,
          baseCurrency: BASE_CURRENCY,
          exchangeRateSnapshot,

          payoutDetailId: payoutDetails._id,

          payoutDetails: {
            accountName: payoutDetails.accountName,
            accountNumber: payoutDetails.accountNumber,
            bankName: payoutDetails.bankName,
            bankCode: payoutDetails.bankCode,
          },

          status: "pending",
        },
      ],
      { session },
    );

    await session.commitTransaction();

    await sendAutoPilotNotification({
      event: "REFERRAL_WITHDRAWAL_REQUESTED",
      user: req.user,
      data: {
        amount,
        currency,
        withdrawalType: "Referral Withdrawal",
      },
      metadata: {
        withdrawalId: withdrawal[0]._id,
        transactionId: transaction[0]._id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Referral Withdrawal request submitted for review",
      data: withdrawal[0],
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Referral Withdrawal error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit Referral Withdrawal",
    });
  } finally {
    session.endSession();
  }
};

exports.withdrawCapital = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const userId = getUserId(req);

    const account = await InvestmentAccount.findOne({
      userId,
      status: "active",
    }).session(session);

    if (!account) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "AutoPilot account not found",
      });
    }

    const existingPendingWithdrawal = await InvestmentWithdrawal.findOne({
      userId,
      investmentAccountId: account._id,
      withdrawalType: "capital",
      status: { $in: ["pending", "approved", "processing"] },
    }).session(session);

    if (existingPendingWithdrawal) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "You already have a Capital Withdrawal under review",
      });
    }

    if (
      account.capitalWithdrawAvailableAt &&
      new Date() < account.capitalWithdrawAvailableAt
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Capital Withdrawal is not yet available",
      });
    }

    const payoutDetails = await PayoutDetail.findOne({
      ownerId: userId,
      isActive: true,
    }).session(session);

    if (!payoutDetails) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Please add payout details first",
      });
    }

    const amount = Number(account.capitalBalance || 0);

    if (amount <= 0) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "No Capital Balance available",
      });
    }

    const currency = normalizeCurrency(account.currency);
    const exchangeRateSnapshot =
      currency === BASE_CURRENCY
        ? 1
        : Number(account.exchangeRateSnapshot || 0);

    const baseAmount = toUsd(amount, currency, exchangeRateSnapshot);

    const beforeCapital = Number(account.capitalBalance || 0);
    const beforeProfit = Number(account.profitBalance || 0);

    account.capitalBalance = roundMoney(beforeCapital - amount);

    await account.save({ session });

    const transaction = await InvestmentTransaction.create(
      [
        {
          userId,
          investmentAccountId: account._id,
          type: "capital_withdrawal",
          status: "pending",

          amount,
          currency,

          baseAmount,
          baseCurrency: BASE_CURRENCY,
          exchangeRateSnapshot,

          balanceBefore: {
            capitalBalance: beforeCapital,
            profitBalance: beforeProfit,
          },
          balanceAfter: {
            capitalBalance: account.capitalBalance,
            profitBalance: account.profitBalance,
          },
          description: "Capital Withdrawal request submitted",
        },
      ],
      { session },
    );

    const withdrawal = await InvestmentWithdrawal.create(
      [
        {
          userId,
          investmentAccountId: account._id,
          transactionId: transaction[0]._id,
          withdrawalType: "capital",

          amount,
          netAmount: 0,
          feeAmount: 0,
          feePolicy: "user_pays",
          currency,

          baseAmount,
          baseNetAmount: 0,
          baseFeeAmount: 0,
          baseCurrency: BASE_CURRENCY,
          exchangeRateSnapshot,

          payoutDetailId: payoutDetails._id,
          payoutDetails: {
            accountName: payoutDetails.accountName,
            accountNumber: payoutDetails.accountNumber,
            bankName: payoutDetails.bankName,
            bankCode: payoutDetails.bankCode,
          },
          status: "pending",
        },
      ],
      { session },
    );

    await session.commitTransaction();

    await sendAutoPilotNotification({
      event: "CAPITAL_WITHDRAWAL_REQUESTED",
      user: req.user,
      data: {
        amount,
        currency,
        withdrawalType: "Capital Withdrawal",
      },
      metadata: {
        withdrawalId: withdrawal[0]._id,
        transactionId: transaction[0]._id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Capital Withdrawal request submitted for review",
      data: withdrawal[0],
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Capital Withdrawal error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit Capital Withdrawal",
    });
  } finally {
    session.endSession();
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { type, status, date } = req.query;

    const filter = {
      userId: getUserId(req),
    };

    if (type) {
      filter.type = type;
    }

    if (status) {
      filter.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);

      if (!Number.isNaN(startDate.getTime())) {
        endDate.setDate(endDate.getDate() + 1);

        filter.createdAt = {
          $gte: startDate,
          $lt: endDate,
        };
      }
    }

    const history = await InvestmentTransaction.find(filter).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("AutoPilot activity error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch AutoPilot activity",
    });
  }
};

exports.getReferralList = async (req, res) => {
  try {
    const userId = getUserId(req);
    const referrerObjectId = new mongoose.Types.ObjectId(userId);

    const referrals = await Referral.find({
      referrer: userId,
    })
      .populate(
        "referredUser",
        "fullName username country currency emailVerified accountStatus createdAt",
      )
      .sort({ createdAt: -1 })
      .lean();

    const bonuses = await ReferralBonus.find({
      referrer: userId,
    })
      .populate("referredUser", "fullName username country currency")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const referredUserIds = referrals
      .map((item) => item?.referredUser?._id)
      .filter(Boolean);

    const accounts = await InvestmentAccount.find({
      userId: { $in: referredUserIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    const accountMap = new Map();

    accounts.forEach((account) => {
      const key = String(account.userId);
      const existing = accountMap.get(key);

      if (!existing) {
        accountMap.set(key, account);
        return;
      }

      if (account.status === "active" && existing.status !== "active") {
        accountMap.set(key, account);
      }
    });

    const bonusSummary = await ReferralBonus.aggregate([
      {
        $match: {
          referrer: referrerObjectId,
          status: "credited",
        },
      },
      {
        $group: {
          _id: "$referredUser",
          totalCommissionGenerated: { $sum: "$amount" },
          totalSourceProfitGenerated: { $sum: "$sourceAmount" },
          bonusCount: { $sum: 1 },
          latestCommission: { $last: "$amount" },
          latestSourceProfit: { $last: "$sourceAmount" },
          latestCommissionAt: { $last: "$createdAt" },
        },
      },
    ]);

    const bonusMap = new Map();

    bonusSummary.forEach((item) => {
      bonusMap.set(String(item._id), item);
    });

    const enrichedReferrals = referrals.map((item) => {
      const referredUser = item.referredUser || null;
      const referredUserId = referredUser?._id
        ? String(referredUser._id)
        : null;

      const account = referredUserId ? accountMap.get(referredUserId) : null;
      const bonus = referredUserId ? bonusMap.get(referredUserId) : null;

      const capitalBalance = Number(account?.capitalBalance || 0);
      const dailyReturnPercentage = Number(
        account?.dailyReturnPercentageSnapshot || 0,
      );

      const estimatedDailyProfit = roundMoney(
        (capitalBalance * dailyReturnPercentage) / 100,
      );

      const estimatedReferralCommission = roundMoney(
        (estimatedDailyProfit * 10) / 100,
      );

      return {
        ...item,

        referredUser,

        autopilot: account
          ? {
              accountId: account._id,
              status: account.status,

              packageId: account.packageId,
              packageName: account.packageNameSnapshot,

              packageAmount: account.packageAmountSnapshot,
              basePackageAmount: account.basePackageAmountSnapshot,
              basePackageCurrency: account.basePackageCurrencySnapshot,

              capitalBalance: account.capitalBalance,
              profitBalance: account.profitBalance,
              totalProfitEarned: account.totalProfitEarned,
              totalProfitWithdrawn: account.totalProfitWithdrawn,

              currency: account.currency,
              userDisplayCurrency: account.userDisplayCurrency,
              exchangeRateSnapshot: account.exchangeRateSnapshot,

              dailyReturnPercentage,
              estimatedDailyProfit,
              estimatedReferralCommission,

              activatedAt: account.activatedAt,
              lastProfitCreditedAt: account.lastProfitCreditedAt,
              lastReinvestDate: account.lastReinvestDate,
              capitalWithdrawAvailableAt: account.capitalWithdrawAvailableAt,
            }
          : null,

        referralEarnings: {
          totalCommissionGenerated: roundMoney(
            bonus?.totalCommissionGenerated || 0,
          ),
          totalSourceProfitGenerated: roundMoney(
            bonus?.totalSourceProfitGenerated || 0,
          ),
          latestCommission: roundMoney(bonus?.latestCommission || 0),
          latestSourceProfit: roundMoney(bonus?.latestSourceProfit || 0),
          latestCommissionAt: bonus?.latestCommissionAt || null,
          bonusCount: bonus?.bonusCount || 0,
        },
      };
    });

    const activeAutoPilotReferrals = enrichedReferrals.filter(
      (item) => item.autopilot?.status === "active",
    );

    const totalReferralEarnings = bonusSummary.reduce(
      (sum, item) => sum + Number(item.totalCommissionGenerated || 0),
      0,
    );

    const totalSourceProfitGenerated = bonusSummary.reduce(
      (sum, item) => sum + Number(item.totalSourceProfitGenerated || 0),
      0,
    );

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalReferrals: referrals.length,
          activeAutoPilotReferrals: activeAutoPilotReferrals.length,
          totalReferralEarnings: roundMoney(totalReferralEarnings),
          totalSourceProfitGenerated: roundMoney(totalSourceProfitGenerated),
        },

        // old response kept
        referrals,
        bonuses,

        // new rich response for future referral screen
        enrichedReferrals,
      },
    });
  } catch (error) {
    console.error("Referral list error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Referral list",
    });
  }
};

const mongoose = require("mongoose");

const InvestmentPackage = require("../models/InvestmentPackage");
const InvestmentAccount = require("../models/InvestmentAccount");
const InvestmentTransaction = require("../models/InvestmentTransaction");
const InvestmentWithdrawal = require("../models/InvestmentWithdrawal");

const PayoutDetail = require("../models/PayoutDetail");

const getUserId = (req) => req.user?._id || req.user?.id;

exports.getPackages = async (req, res) => {
  try {
    const packages = await InvestmentPackage.find({
      isActive: true,
    }).sort({
      sortOrder: 1,
      amount: 1,
    });

    return res.status(200).json({
      success: true,
      data: packages,
    });
  } catch (error) {
    console.error("Get AutoPilot Packages error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch AutoPilot Packages",
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

    const payoutDetails = await PayoutDetail.findOne({
      ownerId: userId,
      isActive: true,
    });

    const recentTransactions = await InvestmentTransaction.find({
      userId,
    })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      data: {
        account,
        payoutDetails,
        recentTransactions,
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

    const beforeCapital = Number(account.capitalBalance || 0);
    const beforeProfit = Number(account.profitBalance || 0);

    account.profitBalance = Number((beforeProfit - amount).toFixed(2));
    account.capitalBalance = Number((beforeCapital + amount).toFixed(2));
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
          currency: account.currency,
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
      message: "Failed to complete Compound Profit",
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

    const beforeCapital = Number(account.capitalBalance || 0);
    const beforeProfit = Number(account.profitBalance || 0);

    account.profitBalance = Number((beforeProfit - amount).toFixed(2));

    await account.save({ session });

    const transaction = await InvestmentTransaction.create(
      [
        {
          userId,
          investmentAccountId: account._id,
          type: "profit_withdrawal",
          status: "pending",
          amount,
          currency: account.currency,
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
          currency: account.currency,
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
      message: "Failed to submit Profit Withdrawal request",
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

    const beforeCapital = Number(account.capitalBalance || 0);
    const beforeProfit = Number(account.profitBalance || 0);

    account.capitalBalance = Number((beforeCapital - amount).toFixed(2));

    await account.save({ session });

    const transaction = await InvestmentTransaction.create(
      [
        {
          userId,
          investmentAccountId: account._id,
          type: "capital_withdrawal",
          status: "pending",
          amount,
          currency: account.currency,
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
          currency: account.currency,
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
      message: "Failed to submit Capital Withdrawal",
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

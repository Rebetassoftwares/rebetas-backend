const InvestmentTransaction = require("../models/InvestmentTransaction");
const InvestmentAccount = require("../models/InvestmentAccount");
const User = require("../models/User");

async function getTransactions(req, res) {
  try {
    const {
      type,
      status,
      userId,
      accountId,
      currency,
      date,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (accountId) filter.investmentAccountId = accountId;
    if (currency) filter.currency = String(currency).toUpperCase();

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

    const currentPage = Math.max(Number(page) || 1, 1);
    const pageLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const skip = (currentPage - 1) * pageLimit;

    const [transactions, total] = await Promise.all([
      InvestmentTransaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),

      InvestmentTransaction.countDocuments(filter),
    ]);

    const userIds = [
      ...new Set(
        transactions
          .map((transaction) => transaction.userId?.toString())
          .filter(Boolean),
      ),
    ];

    const accountIds = [
      ...new Set(
        transactions
          .map((transaction) => transaction.investmentAccountId?.toString())
          .filter(Boolean),
      ),
    ];

    const [users, accounts] = await Promise.all([
      User.find({
        _id: { $in: userIds },
      })
        .select("fullName username email phone country")
        .lean(),

      InvestmentAccount.find({
        _id: { $in: accountIds },
      })
        .select(
          "packageNameSnapshot packageAmountSnapshot capitalBalance profitBalance status currency",
        )
        .lean(),
    ]);

    const userMap = {};
    const accountMap = {};

    users.forEach((user) => {
      userMap[user._id.toString()] = user;
    });

    accounts.forEach((account) => {
      accountMap[account._id.toString()] = account;
    });

    const enrichedTransactions = transactions.map((transaction) => ({
      ...transaction,
      user: userMap[transaction.userId?.toString()] || null,
      account: accountMap[transaction.investmentAccountId?.toString()] || null,
    }));

    return res.status(200).json({
      success: true,
      data: {
        transactions: enrichedTransactions,
        pagination: {
          total,
          page: currentPage,
          limit: pageLimit,
          pages: Math.ceil(total / pageLimit),
        },
      },
    });
  } catch (error) {
    console.error("Get AutoPilot transactions error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch AutoPilot transactions",
    });
  }
}

async function getTransactionById(req, res) {
  try {
    const transaction = await InvestmentTransaction.findById(
      req.params.id,
    ).lean();

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const [user, account] = await Promise.all([
      User.findById(transaction.userId)
        .select("fullName username email phone country")
        .lean(),

      transaction.investmentAccountId
        ? InvestmentAccount.findById(transaction.investmentAccountId)
            .select(
              "packageNameSnapshot packageAmountSnapshot capitalBalance profitBalance status currency",
            )
            .lean()
        : null,
    ]);

    return res.status(200).json({
      success: true,
      data: {
        ...transaction,
        user,
        account,
      },
    });
  } catch (error) {
    console.error("Get AutoPilot transaction error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch transaction",
    });
  }
}

module.exports = {
  getTransactions,
  getTransactionById,
};

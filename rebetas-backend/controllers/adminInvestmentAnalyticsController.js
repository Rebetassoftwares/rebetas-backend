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

function toUsd(amount, currency, exchangeRateSnapshot) {
  const numericAmount = Number(amount || 0);
  const normalizedCurrency = normalizeCurrency(currency);

  if (!numericAmount) return 0;
  if (normalizedCurrency === BASE_CURRENCY) return roundMoney(numericAmount);

  const rate = Number(exchangeRateSnapshot || 0);
  if (!rate || rate <= 0) return 0;

  return roundMoney(numericAmount / rate);
}

function enrichAccountUsd(account) {
  const currency = normalizeCurrency(account.currency);
  const rate = Number(account.exchangeRateSnapshot || 0);

  return {
    ...account,
    baseCurrency: BASE_CURRENCY,
    baseCapitalBalance: toUsd(account.capitalBalance, currency, rate),
    baseProfitBalance: toUsd(account.profitBalance, currency, rate),
    baseTotalProfitEarned: toUsd(account.totalProfitEarned, currency, rate),
    baseTotalProfitWithdrawn: toUsd(
      account.totalProfitWithdrawn,
      currency,
      rate,
    ),
    baseTotalCapitalWithdrawn: toUsd(
      account.totalCapitalWithdrawn,
      currency,
      rate,
    ),
  };
}

async function getAutoPilotAnalytics(req, res) {
  try {
    const { limit = 10 } = req.query;

    const resultLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);

    const [accounts, successfulWithdrawals, transactionSummary] =
      await Promise.all([
        InvestmentAccount.find({}).lean(),

        InvestmentWithdrawal.find({ status: "successful" }).lean(),

        InvestmentTransaction.aggregate([
          {
            $group: {
              _id: {
                type: "$type",
                status: "$status",
                baseCurrency: "$baseCurrency",
              },
              count: { $sum: 1 },
              totalAmount: { $sum: "$baseAmount" },
            },
          },
          {
            $sort: {
              totalAmount: -1,
            },
          },
        ]),
      ]);

    const enrichedAccountsWithUsd = accounts.map(enrichAccountUsd);

    const topCapitalAccounts = [...enrichedAccountsWithUsd]
      .sort((a, b) => b.baseCapitalBalance - a.baseCapitalBalance)
      .slice(0, resultLimit);

    const topProfitAccounts = [...enrichedAccountsWithUsd]
      .sort((a, b) => b.baseProfitBalance - a.baseProfitBalance)
      .slice(0, resultLimit);

    const topProfitEarners = [...enrichedAccountsWithUsd]
      .sort((a, b) => b.baseTotalProfitEarned - a.baseTotalProfitEarned)
      .slice(0, resultLimit);

    const topWithdrawals = [...successfulWithdrawals]
      .map((withdrawal) => ({
        ...withdrawal,
        baseCurrency: withdrawal.baseCurrency || BASE_CURRENCY,
        baseAmount:
          Number(withdrawal.baseAmount || 0) ||
          toUsd(
            withdrawal.amount,
            withdrawal.currency,
            withdrawal.exchangeRateSnapshot,
          ),
      }))
      .sort((a, b) => b.baseAmount - a.baseAmount)
      .slice(0, resultLimit);

    const packageMap = {};

    enrichedAccountsWithUsd.forEach((account) => {
      const key = String(account.packageId || "unknown");

      if (!packageMap[key]) {
        packageMap[key] = {
          packageId: account.packageId,
          packageName: account.packageNameSnapshot || "Unknown Package",
          baseCurrency: BASE_CURRENCY,
          totalAccounts: 0,
          activeAccounts: 0,
          totalBaseCapitalBalance: 0,
          totalBaseProfitBalance: 0,
          totalBaseProfitEarned: 0,
          totalBaseProfitWithdrawn: 0,
          totalBaseCapitalWithdrawn: 0,
        };
      }

      packageMap[key].totalAccounts += 1;

      if (account.status === "active") {
        packageMap[key].activeAccounts += 1;
      }

      packageMap[key].totalBaseCapitalBalance += account.baseCapitalBalance;
      packageMap[key].totalBaseProfitBalance += account.baseProfitBalance;
      packageMap[key].totalBaseProfitEarned += account.baseTotalProfitEarned;
      packageMap[key].totalBaseProfitWithdrawn +=
        account.baseTotalProfitWithdrawn;
      packageMap[key].totalBaseCapitalWithdrawn +=
        account.baseTotalCapitalWithdrawn;
    });

    const packagePerformance = Object.values(packageMap)
      .map((item) => ({
        ...item,
        totalBaseCapitalBalance: roundMoney(item.totalBaseCapitalBalance),
        totalBaseProfitBalance: roundMoney(item.totalBaseProfitBalance),
        totalBaseProfitEarned: roundMoney(item.totalBaseProfitEarned),
        totalBaseProfitWithdrawn: roundMoney(item.totalBaseProfitWithdrawn),
        totalBaseCapitalWithdrawn: roundMoney(item.totalBaseCapitalWithdrawn),
      }))
      .sort((a, b) => b.totalBaseCapitalBalance - a.totalBaseCapitalBalance);

    const userIds = [
      ...new Set(
        [
          ...topCapitalAccounts,
          ...topProfitAccounts,
          ...topProfitEarners,
          ...topWithdrawals,
        ]
          .map((item) => item.userId?.toString())
          .filter(Boolean),
      ),
    ];

    const users = await User.find({
      _id: { $in: userIds },
    })
      .select("fullName username email phone country")
      .lean();

    const userMap = {};

    users.forEach((user) => {
      userMap[user._id.toString()] = user;
    });

    const enrichWithUser = (items) =>
      items.map((item) => ({
        ...item,
        user: userMap[item.userId?.toString()] || null,
      }));

    return res.status(200).json({
      success: true,
      data: {
        baseCurrency: BASE_CURRENCY,
        topCapitalAccounts: enrichWithUser(topCapitalAccounts),
        topProfitAccounts: enrichWithUser(topProfitAccounts),
        topProfitEarners: enrichWithUser(topProfitEarners),
        topWithdrawals: enrichWithUser(topWithdrawals),
        packagePerformance,
        transactionSummary,
      },
    });
  } catch (error) {
    console.error("AutoPilot analytics error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch AutoPilot analytics",
    });
  }
}

module.exports = {
  getAutoPilotAnalytics,
};

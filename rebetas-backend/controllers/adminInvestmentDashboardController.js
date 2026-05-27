const InvestmentAccount = require("../models/InvestmentAccount");
const InvestmentPackage = require("../models/InvestmentPackage");
const InvestmentDeposit = require("../models/InvestmentDeposit");
const InvestmentWithdrawal = require("../models/InvestmentWithdrawal");
const InvestmentTransaction = require("../models/InvestmentTransaction");

const BASE_CURRENCY = "USD";

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function normalizeCurrency(currency) {
  return String(currency || "USD")
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

function getDateKey(date) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "unknown";
  return parsed.toISOString().slice(0, 10);
}

function ensureCurrencyBucket(map, currency) {
  const key = normalizeCurrency(currency);

  if (!map[key]) {
    map[key] = {
      currency: key,
      baseCurrency: BASE_CURRENCY,

      deposits: 0,
      successfulDeposits: 0,
      pendingDeposits: 0,
      failedDeposits: 0,

      pendingWithdrawals: 0,
      approvedWithdrawals: 0,
      processingWithdrawals: 0,
      successfulWithdrawals: 0,
      failedWithdrawals: 0,
      rejectedWithdrawals: 0,

      capitalBalance: 0,
      profitBalance: 0,
      fees: 0,
    };
  }

  return map[key];
}

async function getAdminAutoPilotDashboard(req, res) {
  try {
    const [
      totalPackages,
      activePackages,
      accounts,
      deposits,
      withdrawals,
      transactions,
    ] = await Promise.all([
      InvestmentPackage.countDocuments({}),
      InvestmentPackage.countDocuments({ isActive: true }),
      InvestmentAccount.find({}).lean(),
      InvestmentDeposit.find({}).lean(),
      InvestmentWithdrawal.find({}).lean(),
      InvestmentTransaction.find({}).lean(),
    ]);

    const accountMap = new Map();

    accounts.forEach((account) => {
      accountMap.set(String(account._id), account);
    });

    const overview = {
      baseCurrency: BASE_CURRENCY,

      totalPackages,
      activePackages,

      totalAccounts: accounts.length,
      activeAccounts: accounts.filter((a) => a.status === "active").length,
      suspendedAccounts: accounts.filter((a) => a.status === "suspended")
        .length,
      closedAccounts: accounts.filter((a) => a.status === "closed").length,

      totalDepositsAmount: 0,
      successfulDepositsAmount: 0,
      pendingDepositsAmount: 0,
      failedDepositsAmount: 0,

      totalCapitalBalance: 0,
      totalProfitBalance: 0,
      totalProfitEarned: 0,
      totalProfitWithdrawn: 0,
      totalCapitalWithdrawn: 0,

      pendingWithdrawalsAmount: 0,
      approvedWithdrawalsAmount: 0,
      processingWithdrawalsAmount: 0,
      successfulWithdrawalsAmount: 0,
      failedWithdrawalsAmount: 0,
      rejectedWithdrawalsAmount: 0,

      countPendingWithdrawals: 0,
      countApprovedWithdrawals: 0,
      countProcessingWithdrawals: 0,
      countSuccessfulWithdrawals: 0,
      countFailedWithdrawals: 0,
      countRejectedWithdrawals: 0,

      totalFees: 0,
      missingExchangeRateCount: 0,
    };

    const byCurrencyMap = {};
    const packageBreakdownMap = {};
    const depositTrendMap = {};
    const withdrawalTrendMap = {};
    const transactionTypeMap = {};

    accounts.forEach((account) => {
      const currency = normalizeCurrency(account.currency);
      const rate = account.exchangeRateSnapshot;

      const capitalBalance = toUsd(account.capitalBalance, currency, rate);
      const profitBalance = toUsd(account.profitBalance, currency, rate);
      const totalProfitEarned = toUsd(
        account.totalProfitEarned,
        currency,
        rate,
      );
      const totalProfitWithdrawn = toUsd(
        account.totalProfitWithdrawn,
        currency,
        rate,
      );
      const totalCapitalWithdrawn = toUsd(
        account.totalCapitalWithdrawn,
        currency,
        rate,
      );

      if (currency !== BASE_CURRENCY && !Number(rate || 0)) {
        overview.missingExchangeRateCount += 1;
      }

      overview.totalCapitalBalance += capitalBalance;
      overview.totalProfitBalance += profitBalance;
      overview.totalProfitEarned += totalProfitEarned;
      overview.totalProfitWithdrawn += totalProfitWithdrawn;
      overview.totalCapitalWithdrawn += totalCapitalWithdrawn;

      const currencyBucket = ensureCurrencyBucket(byCurrencyMap, currency);

      currencyBucket.capitalBalance += capitalBalance;
      currencyBucket.profitBalance += profitBalance;

      const packageKey = String(account.packageId || "unknown");

      if (!packageBreakdownMap[packageKey]) {
        packageBreakdownMap[packageKey] = {
          packageId: account.packageId,
          packageName: account.packageNameSnapshot || "Unknown Package",
          baseCurrency: BASE_CURRENCY,
          users: 0,
          activeUsers: 0,
          totalCapitalBalance: 0,
          totalProfitBalance: 0,
          totalProfitEarned: 0,
          totalProfitWithdrawn: 0,
          totalCapitalWithdrawn: 0,
        };
      }

      packageBreakdownMap[packageKey].users += 1;

      if (account.status === "active") {
        packageBreakdownMap[packageKey].activeUsers += 1;
      }

      packageBreakdownMap[packageKey].totalCapitalBalance += capitalBalance;
      packageBreakdownMap[packageKey].totalProfitBalance += profitBalance;
      packageBreakdownMap[packageKey].totalProfitEarned += totalProfitEarned;
      packageBreakdownMap[packageKey].totalProfitWithdrawn +=
        totalProfitWithdrawn;
      packageBreakdownMap[packageKey].totalCapitalWithdrawn +=
        totalCapitalWithdrawn;
    });

    deposits.forEach((deposit) => {
      const currency = normalizeCurrency(deposit.currency);
      const dateKey = getDateKey(deposit.createdAt);

      const amount =
        Number(deposit.baseAmount || 0) ||
        toUsd(deposit.amount, currency, deposit.exchangeRateSnapshot);

      overview.totalDepositsAmount += amount;

      const currencyBucket = ensureCurrencyBucket(byCurrencyMap, currency);
      currencyBucket.deposits += amount;

      if (deposit.status === "successful") {
        overview.successfulDepositsAmount += amount;
        currencyBucket.successfulDeposits += amount;
      }

      if (deposit.status === "pending") {
        overview.pendingDepositsAmount += amount;
        currencyBucket.pendingDeposits += amount;
      }

      if (deposit.status === "failed") {
        overview.failedDepositsAmount += amount;
        currencyBucket.failedDeposits += amount;
      }

      if (!depositTrendMap[dateKey]) {
        depositTrendMap[dateKey] = {
          date: dateKey,
          baseCurrency: BASE_CURRENCY,
          total: 0,
          successful: 0,
          pending: 0,
          failed: 0,
        };
      }

      depositTrendMap[dateKey].total += amount;

      if (depositTrendMap[dateKey][deposit.status] !== undefined) {
        depositTrendMap[dateKey][deposit.status] += amount;
      }
    });

    withdrawals.forEach((withdrawal) => {
      const currency = normalizeCurrency(withdrawal.currency);
      const account = accountMap.get(String(withdrawal.investmentAccountId));
      const rate = account?.exchangeRateSnapshot;
      const dateKey = getDateKey(withdrawal.createdAt);

      const amount = toUsd(withdrawal.amount, currency, rate);
      const feeAmount = toUsd(withdrawal.feeAmount, currency, rate);

      if (currency !== BASE_CURRENCY && !Number(rate || 0)) {
        overview.missingExchangeRateCount += 1;
      }

      overview.totalFees += feeAmount;

      const currencyBucket = ensureCurrencyBucket(byCurrencyMap, currency);
      currencyBucket.fees += feeAmount;

      if (withdrawal.status === "pending") {
        overview.pendingWithdrawalsAmount += amount;
        overview.countPendingWithdrawals += 1;
        currencyBucket.pendingWithdrawals += amount;
      }

      if (withdrawal.status === "approved") {
        overview.approvedWithdrawalsAmount += amount;
        overview.countApprovedWithdrawals += 1;
        currencyBucket.approvedWithdrawals += amount;
      }

      if (withdrawal.status === "processing") {
        overview.processingWithdrawalsAmount += amount;
        overview.countProcessingWithdrawals += 1;
        currencyBucket.processingWithdrawals += amount;
      }

      if (withdrawal.status === "successful") {
        overview.successfulWithdrawalsAmount += amount;
        overview.countSuccessfulWithdrawals += 1;
        currencyBucket.successfulWithdrawals += amount;
      }

      if (withdrawal.status === "failed") {
        overview.failedWithdrawalsAmount += amount;
        overview.countFailedWithdrawals += 1;
        currencyBucket.failedWithdrawals += amount;
      }

      if (withdrawal.status === "rejected") {
        overview.rejectedWithdrawalsAmount += amount;
        overview.countRejectedWithdrawals += 1;
        currencyBucket.rejectedWithdrawals += amount;
      }

      if (!withdrawalTrendMap[dateKey]) {
        withdrawalTrendMap[dateKey] = {
          date: dateKey,
          baseCurrency: BASE_CURRENCY,
          requested: 0,
          pending: 0,
          approved: 0,
          processing: 0,
          successful: 0,
          failed: 0,
          rejected: 0,
          fees: 0,
        };
      }

      withdrawalTrendMap[dateKey].requested += amount;
      withdrawalTrendMap[dateKey].fees += feeAmount;

      if (withdrawalTrendMap[dateKey][withdrawal.status] !== undefined) {
        withdrawalTrendMap[dateKey][withdrawal.status] += amount;
      }
    });

    transactions.forEach((transaction) => {
      const type = transaction.type || "unknown";
      const currency = normalizeCurrency(transaction.currency);
      const account = accountMap.get(String(transaction.investmentAccountId));

      const amount = toUsd(
        transaction.amount,
        currency,
        account?.exchangeRateSnapshot,
      );

      if (!transactionTypeMap[type]) {
        transactionTypeMap[type] = {
          type,
          baseCurrency: BASE_CURRENCY,
          count: 0,
          amount: 0,
        };
      }

      transactionTypeMap[type].count += 1;
      transactionTypeMap[type].amount += amount;
    });

    function roundMoneyFields(item) {
      const result = { ...item };

      Object.keys(result).forEach((key) => {
        if (
          typeof result[key] === "number" &&
          !key.toLowerCase().includes("count") &&
          !key.toLowerCase().includes("users") &&
          !key.toLowerCase().includes("accounts") &&
          !key.toLowerCase().includes("packages")
        ) {
          result[key] = roundMoney(result[key]);
        }
      });

      return result;
    }

    return res.status(200).json({
      success: true,
      data: {
        baseCurrency: BASE_CURRENCY,
        overview: roundMoneyFields(overview),

        byCurrency: Object.values(byCurrencyMap).map(roundMoneyFields),

        packageBreakdown: Object.values(packageBreakdownMap)
          .map(roundMoneyFields)
          .sort((a, b) => b.totalCapitalBalance - a.totalCapitalBalance),

        depositTrend: Object.values(depositTrendMap)
          .map(roundMoneyFields)
          .sort((a, b) => a.date.localeCompare(b.date)),

        withdrawalTrend: Object.values(withdrawalTrendMap)
          .map(roundMoneyFields)
          .sort((a, b) => a.date.localeCompare(b.date)),

        transactionTypes: Object.values(transactionTypeMap)
          .map(roundMoneyFields)
          .sort((a, b) => b.amount - a.amount),
      },
    });
  } catch (error) {
    console.error("Admin AutoPilot Dashboard error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch AutoPilot Dashboard",
    });
  }
}

module.exports = {
  getAdminAutoPilotDashboard,
};

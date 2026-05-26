const InvestmentAccount = require("../models/InvestmentAccount");
const InvestmentPackage = require("../models/InvestmentPackage");
const InvestmentDeposit = require("../models/InvestmentDeposit");
const InvestmentWithdrawal = require("../models/InvestmentWithdrawal");
const InvestmentTransaction = require("../models/InvestmentTransaction");

async function getAdminAutoPilotDashboard(req, res) {
  try {
    const [
      totalPackages,
      activePackages,
      totalAccounts,
      activeAccounts,
      suspendedAccounts,
      closedAccounts,
      deposits,
      withdrawals,
      transactions,
      packageBreakdown,
    ] = await Promise.all([
      InvestmentPackage.countDocuments({}),
      InvestmentPackage.countDocuments({ isActive: true }),

      InvestmentAccount.countDocuments({}),
      InvestmentAccount.countDocuments({ status: "active" }),
      InvestmentAccount.countDocuments({ status: "suspended" }),
      InvestmentAccount.countDocuments({ status: "closed" }),

      InvestmentDeposit.find({}).lean(),
      InvestmentWithdrawal.find({}).lean(),
      InvestmentTransaction.find({}).lean(),

      InvestmentAccount.aggregate([
        {
          $group: {
            _id: "$packageId",
            packageName: { $first: "$packageNameSnapshot" },
            currency: { $first: "$currency" },
            users: { $sum: 1 },
            activeUsers: {
              $sum: {
                $cond: [{ $eq: ["$status", "active"] }, 1, 0],
              },
            },
            totalCapitalBalance: { $sum: "$capitalBalance" },
            totalProfitBalance: { $sum: "$profitBalance" },
            totalProfitEarned: { $sum: "$totalProfitEarned" },
            totalProfitWithdrawn: { $sum: "$totalProfitWithdrawn" },
            totalCapitalWithdrawn: { $sum: "$totalCapitalWithdrawn" },
          },
        },
        {
          $sort: {
            totalCapitalBalance: -1,
          },
        },
      ]),
    ]);

    const overview = {
      totalPackages,
      activePackages,

      totalAccounts,
      activeAccounts,
      suspendedAccounts,
      closedAccounts,

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
    };

    const byCurrencyMap = {};
    const withdrawalTrendMap = {};
    const depositTrendMap = {};
    const transactionTypeMap = {};

    deposits.forEach((deposit) => {
      const amount = Number(deposit.amount || 0);
      const currency = deposit.currency || "UNKNOWN";
      const dateKey = new Date(deposit.createdAt).toISOString().slice(0, 10);

      overview.totalDepositsAmount += amount;

      if (deposit.status === "successful") {
        overview.successfulDepositsAmount += amount;
      }

      if (deposit.status === "pending") {
        overview.pendingDepositsAmount += amount;
      }

      if (deposit.status === "failed") {
        overview.failedDepositsAmount += amount;
      }

      if (!depositTrendMap[dateKey]) {
        depositTrendMap[dateKey] = {
          date: dateKey,
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

      if (!byCurrencyMap[currency]) {
        byCurrencyMap[currency] = {
          currency,
          deposits: 0,
          successfulDeposits: 0,
          pendingWithdrawals: 0,
          successfulWithdrawals: 0,
          capitalBalance: 0,
          profitBalance: 0,
          fees: 0,
        };
      }

      byCurrencyMap[currency].deposits += amount;

      if (deposit.status === "successful") {
        byCurrencyMap[currency].successfulDeposits += amount;
      }
    });

    withdrawals.forEach((withdrawal) => {
      const amount = Number(withdrawal.amount || 0);
      const feeAmount = Number(withdrawal.feeAmount || 0);
      const currency = withdrawal.currency || "UNKNOWN";
      const dateKey = new Date(withdrawal.createdAt).toISOString().slice(0, 10);

      overview.totalFees += feeAmount;

      if (withdrawal.status === "pending") {
        overview.pendingWithdrawalsAmount += amount;
        overview.countPendingWithdrawals += 1;
      }

      if (withdrawal.status === "approved") {
        overview.approvedWithdrawalsAmount += amount;
        overview.countApprovedWithdrawals += 1;
      }

      if (withdrawal.status === "processing") {
        overview.processingWithdrawalsAmount += amount;
        overview.countProcessingWithdrawals += 1;
      }

      if (withdrawal.status === "successful") {
        overview.successfulWithdrawalsAmount += amount;
        overview.countSuccessfulWithdrawals += 1;
      }

      if (withdrawal.status === "failed") {
        overview.failedWithdrawalsAmount += amount;
        overview.countFailedWithdrawals += 1;
      }

      if (withdrawal.status === "rejected") {
        overview.rejectedWithdrawalsAmount += amount;
        overview.countRejectedWithdrawals += 1;
      }

      if (!withdrawalTrendMap[dateKey]) {
        withdrawalTrendMap[dateKey] = {
          date: dateKey,
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

      if (!byCurrencyMap[currency]) {
        byCurrencyMap[currency] = {
          currency,
          deposits: 0,
          successfulDeposits: 0,
          pendingWithdrawals: 0,
          successfulWithdrawals: 0,
          capitalBalance: 0,
          profitBalance: 0,
          fees: 0,
        };
      }

      byCurrencyMap[currency].fees += feeAmount;

      if (withdrawal.status === "pending") {
        byCurrencyMap[currency].pendingWithdrawals += amount;
      }

      if (withdrawal.status === "successful") {
        byCurrencyMap[currency].successfulWithdrawals += amount;
      }
    });

    transactions.forEach((transaction) => {
      const type = transaction.type || "unknown";
      const amount = Number(transaction.amount || 0);

      if (!transactionTypeMap[type]) {
        transactionTypeMap[type] = {
          type,
          count: 0,
          amount: 0,
        };
      }

      transactionTypeMap[type].count += 1;
      transactionTypeMap[type].amount += amount;
    });

    packageBreakdown.forEach((item) => {
      const currency = item.currency || "UNKNOWN";

      overview.totalCapitalBalance += Number(item.totalCapitalBalance || 0);
      overview.totalProfitBalance += Number(item.totalProfitBalance || 0);
      overview.totalProfitEarned += Number(item.totalProfitEarned || 0);
      overview.totalProfitWithdrawn += Number(item.totalProfitWithdrawn || 0);
      overview.totalCapitalWithdrawn += Number(item.totalCapitalWithdrawn || 0);

      if (!byCurrencyMap[currency]) {
        byCurrencyMap[currency] = {
          currency,
          deposits: 0,
          successfulDeposits: 0,
          pendingWithdrawals: 0,
          successfulWithdrawals: 0,
          capitalBalance: 0,
          profitBalance: 0,
          fees: 0,
        };
      }

      byCurrencyMap[currency].capitalBalance += Number(
        item.totalCapitalBalance || 0,
      );
      byCurrencyMap[currency].profitBalance += Number(
        item.totalProfitBalance || 0,
      );
    });

    return res.status(200).json({
      success: true,
      data: {
        overview,
        byCurrency: Object.values(byCurrencyMap),
        packageBreakdown,
        depositTrend: Object.values(depositTrendMap).sort((a, b) =>
          a.date.localeCompare(b.date),
        ),
        withdrawalTrend: Object.values(withdrawalTrendMap).sort((a, b) =>
          a.date.localeCompare(b.date),
        ),
        transactionTypes: Object.values(transactionTypeMap),
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

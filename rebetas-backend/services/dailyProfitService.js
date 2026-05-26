const mongoose = require("mongoose");

const InvestmentAccount = require("../models/InvestmentAccount");
const InvestmentTransaction = require("../models/InvestmentTransaction");

function getStartOfToday() {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function calculateDailyProfit(capitalBalance, dailyReturnPercentage) {
  const capital = Number(capitalBalance || 0);
  const percentage = Number(dailyReturnPercentage || 0);

  if (capital <= 0 || percentage <= 0) {
    return 0;
  }

  return Number(((capital * percentage) / 100).toFixed(2));
}

async function creditDailyProfits({ adminId = null, force = false } = {}) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const startOfToday = getStartOfToday();

    const filter = {
      status: "active",
      capitalBalance: { $gt: 0 },
      dailyReturnPercentageSnapshot: { $gt: 0 },
    };

    if (!force) {
      filter.$or = [
        { lastProfitCreditedAt: null },
        { lastProfitCreditedAt: { $lt: startOfToday } },
      ];
    }

    const accounts = await InvestmentAccount.find(filter).session(session);

    let creditedCount = 0;
    let skippedCount = 0;
    let totalProfitCredited = 0;

    const creditedAccounts = [];

    for (const account of accounts) {
      const profitAmount = calculateDailyProfit(
        account.capitalBalance,
        account.dailyReturnPercentageSnapshot,
      );

      if (profitAmount <= 0) {
        skippedCount += 1;
        continue;
      }

      const beforeCapital = account.capitalBalance;
      const beforeProfit = account.profitBalance;

      account.profitBalance = Number(
        (Number(account.profitBalance || 0) + profitAmount).toFixed(2),
      );

      account.totalProfitEarned = Number(
        (Number(account.totalProfitEarned || 0) + profitAmount).toFixed(2),
      );

      account.lastProfitCreditedAt = new Date();

      await account.save({ session });

      await InvestmentTransaction.create(
        [
          {
            userId: account.userId,
            investmentAccountId: account._id,
            type: "profit_credit",
            status: "successful",
            amount: profitAmount,
            currency: account.currency,
            balanceBefore: {
              capitalBalance: beforeCapital,
              profitBalance: beforeProfit,
            },
            balanceAfter: {
              capitalBalance: account.capitalBalance,
              profitBalance: account.profitBalance,
            },
            description: "Daily Profit Credit applied",
            metadata: {
              triggeredByAdminId: adminId,
              dailyReturnPercentageSnapshot:
                account.dailyReturnPercentageSnapshot,
              creditedForDate: startOfToday,
              packageId: account.packageId,
              packageNameSnapshot: account.packageNameSnapshot,
              force,
            },
          },
        ],
        { session },
      );

      creditedCount += 1;
      totalProfitCredited += profitAmount;

      creditedAccounts.push({
        accountId: account._id,
        userId: account.userId,
        packageName: account.packageNameSnapshot,
        capitalBalance: account.capitalBalance,
        dailyReturnPercentage: account.dailyReturnPercentageSnapshot,
        profitCredited: profitAmount,
        currency: account.currency,
      });
    }

    await session.commitTransaction();

    return {
      creditedCount,
      skippedCount,
      totalProfitCredited: Number(totalProfitCredited.toFixed(2)),
      creditedAccounts,
    };
  } catch (error) {
    await session.abortTransaction();

    console.error("AutoPilot Daily Profit Credit error:", error.message);

    throw error;
  } finally {
    session.endSession();
  }
}

module.exports = {
  creditDailyProfits,
  calculateDailyProfit,
};

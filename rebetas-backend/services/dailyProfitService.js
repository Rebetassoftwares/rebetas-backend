const mongoose = require("mongoose");

const InvestmentAccount = require("../models/InvestmentAccount");
const InvestmentTransaction = require("../models/InvestmentTransaction");

const { sendAutoPilotNotification } = require("./notificationService");
const { creditReferralBonus } = require("./referralService");

const User = require("../models/User");

const BASE_CURRENCY = "USD";

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function getStartOfToday() {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
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

  if (normalizedCurrency === BASE_CURRENCY) {
    return roundMoney(numericAmount);
  }

  const rate = Number(exchangeRateSnapshot || 0);

  if (!rate || rate <= 0) {
    return 0;
  }

  return roundMoney(numericAmount / rate);
}

function calculateDailyProfit(capitalBalance, dailyReturnPercentage) {
  const capital = Number(capitalBalance || 0);
  const percentage = Number(dailyReturnPercentage || 0);

  if (capital <= 0 || percentage <= 0) {
    return 0;
  }

  return roundMoney((capital * percentage) / 100);
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
    let totalBaseProfitCredited = 0;
    let missingExchangeRateCount = 0;

    const creditedAccounts = [];

    for (const account of accounts) {
      const currency = normalizeCurrency(account.currency);
      const exchangeRateSnapshot =
        currency === BASE_CURRENCY
          ? 1
          : Number(account.exchangeRateSnapshot || 0);

      if (
        currency !== BASE_CURRENCY &&
        (!exchangeRateSnapshot || exchangeRateSnapshot <= 0)
      ) {
        skippedCount += 1;
        missingExchangeRateCount += 1;
        continue;
      }

      const profitAmount = calculateDailyProfit(
        account.capitalBalance,
        account.dailyReturnPercentageSnapshot,
      );

      if (profitAmount <= 0) {
        skippedCount += 1;
        continue;
      }

      const baseProfitAmount = toUsd(
        profitAmount,
        currency,
        exchangeRateSnapshot,
      );

      const beforeCapital = account.capitalBalance;
      const beforeProfit = account.profitBalance;

      account.profitBalance = roundMoney(
        Number(account.profitBalance || 0) + profitAmount,
      );

      account.totalProfitEarned = roundMoney(
        Number(account.totalProfitEarned || 0) + profitAmount,
      );

      account.lastProfitCreditedAt = new Date();

      await account.save({ session });

      const transaction = await InvestmentTransaction.create(
        [
          {
            userId: account.userId,
            investmentAccountId: account._id,
            type: "profit_credit",
            status: "successful",

            // user/local value
            amount: profitAmount,
            currency,

            // admin/USD value
            baseAmount: baseProfitAmount,
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

      try {
        await creditReferralBonus({
          referredUserId: account.userId,
          sourceType: "autopilot_profit_credit",
          sourceId: transaction[0]._id,

          sourceAmount: profitAmount,
          sourceCurrency: currency,
          sourceExchangeRateSnapshot: exchangeRateSnapshot,

          metadata: {
            investmentAccountId: account._id,
            packageId: account.packageId,
            packageNameSnapshot: account.packageNameSnapshot,
            creditedForDate: startOfToday,
            dailyReturnPercentageSnapshot:
              account.dailyReturnPercentageSnapshot,
            triggeredByAdminId: adminId,
            force,
          },

          note: "AutoPilot Profit Credit referral bonus",
          session,
        });
      } catch (error) {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }

        console.error(
          "========== AUTOPILOT DAILY PROFIT CREDIT ERROR ==========",
        );
        console.error(error);
        console.error("message:", error.message);
        console.error("stack:", error.stack);

        throw error;
      }

      creditedCount += 1;
      totalProfitCredited += profitAmount;
      totalBaseProfitCredited += baseProfitAmount;

      creditedAccounts.push({
        accountId: account._id,
        userId: account.userId,
        packageName: account.packageNameSnapshot,
        dailyReturnPercentage: account.dailyReturnPercentageSnapshot,

        capitalBalance: account.capitalBalance,
        profitCredited: profitAmount,
        currency,

        baseCapitalBalance: toUsd(
          account.capitalBalance,
          currency,
          exchangeRateSnapshot,
        ),
        baseProfitCredited: baseProfitAmount,
        baseCurrency: BASE_CURRENCY,
        exchangeRateSnapshot,
      });
    }

    await session.commitTransaction();

    for (const credited of creditedAccounts) {
      try {
        const user = await User.findById(credited.userId)
          .select("_id fullName email")
          .lean();

        if (!user) continue;

        await sendAutoPilotNotification({
          event: "PROFIT_CREDIT",
          user,
          data: {
            amount: credited.profitCredited,
            currency: credited.currency,
          },
          metadata: {
            investmentAccountId: credited.accountId,
            packageName: credited.packageName,
            dailyReturnPercentage: credited.dailyReturnPercentage,
          },
        });
      } catch (notificationError) {
        console.error(
          "Daily Profit notification error:",
          notificationError.message,
        );
      }
    }

    return {
      baseCurrency: BASE_CURRENCY,
      creditedCount,
      skippedCount,
      missingExchangeRateCount,
      totalProfitCredited: roundMoney(totalProfitCredited),
      totalBaseProfitCredited: roundMoney(totalBaseProfitCredited),
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

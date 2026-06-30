const mongoose = require("mongoose");

const InvestmentAccount = require("../models/InvestmentAccount");
const InvestmentTransaction = require("../models/InvestmentTransaction");
const User = require("../models/User");

const { sendAutoPilotNotification } = require("./notificationService");
const { creditReferralBonus } = require("./referralService");

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
  if (normalizedCurrency === BASE_CURRENCY) return roundMoney(numericAmount);

  const rate = Number(exchangeRateSnapshot || 0);
  if (!rate || rate <= 0) return 0;

  return roundMoney(numericAmount / rate);
}

function calculateDailyProfit(capitalBalance, dailyReturnPercentage) {
  const capital = Number(capitalBalance || 0);
  const percentage = Number(dailyReturnPercentage || 0);

  if (capital <= 0 || percentage <= 0) return 0;

  return roundMoney((capital * percentage) / 100);
}

function isTransientTransactionError(error) {
  return (
    error?.errorLabelSet?.has?.("TransientTransactionError") ||
    error?.errorLabels?.includes?.("TransientTransactionError") ||
    error?.codeName === "WriteConflict" ||
    String(error?.message || "")
      .toLowerCase()
      .includes("write conflict")
  );
}

async function runWithRetry(fn, retries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isTransientTransactionError(error) || attempt === retries) {
        throw error;
      }

      console.log(`⚠️ Transaction retry ${attempt}/${retries}`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 300));
    }
  }

  throw lastError;
}

async function creditSingleAccount({
  accountId,
  adminId,
  force,
  startOfToday,
}) {
  const session = await mongoose.startSession();

  try {
    let result = null;

    await runWithRetry(async () => {
      await session.withTransaction(async () => {
        const account =
          await InvestmentAccount.findById(accountId).session(session);

        if (!account || account.status !== "active") {
          result = { skipped: true, reason: "inactive_or_missing" };
          return;
        }

        if (
          !force &&
          account.lastProfitCreditedAt &&
          account.lastProfitCreditedAt >= startOfToday
        ) {
          result = { skipped: true, reason: "already_credited_today" };
          return;
        }

        const currency = normalizeCurrency(account.currency);

        const exchangeRateSnapshot =
          currency === BASE_CURRENCY
            ? 1
            : Number(account.exchangeRateSnapshot || 0);

        if (
          currency !== BASE_CURRENCY &&
          (!exchangeRateSnapshot || exchangeRateSnapshot <= 0)
        ) {
          result = { skipped: true, reason: "missing_exchange_rate" };
          return;
        }

        const profitAmount = calculateDailyProfit(
          account.capitalBalance,
          account.dailyReturnPercentageSnapshot,
        );

        if (profitAmount <= 0) {
          result = { skipped: true, reason: "zero_profit" };
          return;
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

              amount: profitAmount,
              currency,

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

        result = {
          skipped: false,
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
        };
      });
    });

    return result;
  } finally {
    session.endSession();
  }
}

async function creditDailyProfits({ adminId = null, force = false } = {}) {
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

  const accounts = await InvestmentAccount.find(filter).select("_id").lean();

  let creditedCount = 0;
  let skippedCount = 0;
  let missingExchangeRateCount = 0;
  let failedCount = 0;

  let totalProfitCredited = 0;
  let totalBaseProfitCredited = 0;

  const creditedAccounts = [];
  const failedAccounts = [];

  for (const account of accounts) {
    try {
      const result = await creditSingleAccount({
        accountId: account._id,
        adminId,
        force,
        startOfToday,
      });

      if (!result || result.skipped) {
        skippedCount += 1;

        if (result?.reason === "missing_exchange_rate") {
          missingExchangeRateCount += 1;
        }

        continue;
      }

      creditedCount += 1;
      totalProfitCredited += Number(result.profitCredited || 0);
      totalBaseProfitCredited += Number(result.baseProfitCredited || 0);

      creditedAccounts.push(result);
    } catch (error) {
      failedCount += 1;

      console.error("❌ Daily Profit account failed:", {
        accountId: account._id,
        message: error.message,
        code: error.code,
        codeName: error.codeName,
      });

      failedAccounts.push({
        accountId: account._id,
        message: error.message,
      });
    }
  }

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
    failedCount,
    missingExchangeRateCount,
    totalProfitCredited: roundMoney(totalProfitCredited),
    totalBaseProfitCredited: roundMoney(totalBaseProfitCredited),
    creditedAccounts,
    failedAccounts,
  };
}

module.exports = {
  creditDailyProfits,
  calculateDailyProfit,
};

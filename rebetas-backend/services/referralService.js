const User = require("../models/User");
const Referral = require("../models/Referral");
const ReferralBonus = require("../models/ReferralBonus");

const {
  generateReferralCode,
  buildReferralLink,
} = require("../utils/referralCode");

const { getAdminExchangeRate } = require("./currencyConversionService");
const { sendAutoPilotNotification } = require("./notificationService");

const BASE_CURRENCY = "USD";

const SUBSCRIPTION_REFERRAL_RATE = 0.1; // 10%
const AUTOPILOT_PROFIT_CREDIT_REFERRAL_RATE = 0.1; // 20%

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function normalizeCurrency(currency) {
  return String(currency || "")
    .trim()
    .toUpperCase();
}

async function generateUniqueReferralCode({ username }) {
  let referralCode;
  let exists = true;

  while (exists) {
    referralCode = generateReferralCode(username);
    exists = await User.exists({ referralCode });
  }

  return referralCode;
}

async function findReferrerByCode(referralCode) {
  const code = String(referralCode || "")
    .trim()
    .toUpperCase();

  if (!code) return null;

  return User.findOne({
    referralCode: code,
    accountStatus: "active",
  });
}

async function createReferralRelationship({
  referrerId,
  referredUserId,
  referralCodeUsed,
}) {
  if (!referrerId || !referredUserId || !referralCodeUsed) return null;

  if (String(referrerId) === String(referredUserId)) {
    throw new Error("A user cannot refer themselves");
  }

  const existingReferral = await Referral.findOne({
    referredUser: referredUserId,
  });

  if (existingReferral) return existingReferral;

  return Referral.create({
    referrer: referrerId,
    referredUser: referredUserId,
    referralCodeUsed: String(referralCodeUsed).trim().toUpperCase(),
  });
}

function getBonusRate(sourceType) {
  if (sourceType === "subscription_payment") {
    return SUBSCRIPTION_REFERRAL_RATE;
  }

  if (sourceType === "autopilot_profit_credit") {
    return AUTOPILOT_PROFIT_CREDIT_REFERRAL_RATE;
  }

  throw new Error("Invalid referral bonus source type");
}

async function creditReferralBonus({
  referredUserId,
  sourceType,
  sourceId = null,
  sourceAmount,
  sourceCurrency,
  sourceExchangeRateSnapshot = null,
  metadata = {},
  note = "",
  session = null,
}) {
  const numericSourceAmount = Number(sourceAmount);

  if (
    !referredUserId ||
    !sourceType ||
    !numericSourceAmount ||
    numericSourceAmount <= 0
  ) {
    return null;
  }

  const normalizedSourceCurrency = normalizeCurrency(sourceCurrency);

  if (!normalizedSourceCurrency) {
    throw new Error("Source currency is required");
  }

  const referral = await Referral.findOne({
    referredUser: referredUserId,
    status: "active",
  }).session(session);

  if (!referral) return null;

  const referrer = await User.findById(referral.referrer).session(session);

  if (!referrer || referrer.accountStatus !== "active") {
    return null;
  }

  if (!referrer.currency) {
    throw new Error("Referrer currency is required");
  }

  const referrerCurrency = normalizeCurrency(referrer.currency);

  if (!referrerCurrency) {
    throw new Error("Referrer currency is required");
  }

  const bonusRate = getBonusRate(sourceType);

  const localBonusFromSource = roundMoney(numericSourceAmount * bonusRate);

  let baseAmount = localBonusFromSource;

  if (normalizedSourceCurrency !== BASE_CURRENCY) {
    const sourceRate = Number(sourceExchangeRateSnapshot || 0);

    if (!sourceRate || sourceRate <= 0) {
      throw new Error("Source exchange rate snapshot is required");
    }

    baseAmount = roundMoney(localBonusFromSource / sourceRate);
  }

  let referrerExchangeRateSnapshot = 1;
  let finalAmount = baseAmount;

  if (referrerCurrency !== BASE_CURRENCY) {
    referrerExchangeRateSnapshot = await getAdminExchangeRate({
      baseCurrency: BASE_CURRENCY,
      targetCurrency: referrerCurrency,
    });

    finalAmount = roundMoney(baseAmount * referrerExchangeRateSnapshot);
  }

  const bonus = await ReferralBonus.create(
    [
      {
        referrer: referral.referrer,
        referredUser: referredUserId,

        sourceType,
        sourceId,

        amount: finalAmount,
        currency: referrerCurrency,

        baseAmount,
        baseCurrency: BASE_CURRENCY,
        exchangeRateSnapshot: referrerExchangeRateSnapshot,

        sourceAmount: numericSourceAmount,
        sourceCurrency: normalizedSourceCurrency,

        bonusRate,
        status: "credited",

        metadata,
        note,
      },
    ],
    session ? { session } : undefined,
  );

  referrer.referralBalance = roundMoney(
    Number(referrer.referralBalance || 0) + finalAmount,
  );

  referrer.totalReferralEarned = roundMoney(
    Number(referrer.totalReferralEarned || 0) + finalAmount,
  );

  await referrer.save({ session });

  try {
    await sendAutoPilotNotification({
      event: "REFERRAL_BONUS",
      user: referrer,
      data: {
        amount: finalAmount,
        currency: referrerCurrency,
      },
      metadata: {
        referralBonusId: bonus[0]._id,
        referredUserId,
        sourceType,
        sourceId,
      },
    });
  } catch (notificationError) {
    console.error(
      "Referral bonus notification error:",
      notificationError.message,
    );
  }

  return bonus[0];
}

module.exports = {
  generateUniqueReferralCode,
  buildReferralLink,
  findReferrerByCode,
  createReferralRelationship,
  creditReferralBonus,
};

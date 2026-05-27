const CurrencyRate = require("../models/CurrencyRate");

function normalizeCurrency(currency) {
  return String(currency || "")
    .trim()
    .toUpperCase();
}

async function getAdminExchangeRate({ baseCurrency = "USD", targetCurrency }) {
  const base = normalizeCurrency(baseCurrency);
  const target = normalizeCurrency(targetCurrency);

  if (!base || !target) {
    throw new Error("Base currency and target currency are required");
  }

  if (base === target) {
    return 1;
  }

  const rateRecord = await CurrencyRate.findOne({
    baseCurrency: base,
    targetCurrency: target,
    isActive: true,
  }).lean();

  if (!rateRecord) {
    throw new Error(
      `Exchange rate from ${base} to ${target} is not configured`,
    );
  }

  return Number(rateRecord.rate);
}

async function convertFromBaseCurrency({
  amount,
  baseCurrency = "USD",
  targetCurrency,
}) {
  const numericAmount = Number(amount);

  if (!numericAmount || numericAmount <= 0) {
    throw new Error("Valid amount is required");
  }

  const rate = await getAdminExchangeRate({
    baseCurrency,
    targetCurrency,
  });

  const convertedAmount = Number((numericAmount * rate).toFixed(2));

  return {
    baseAmount: numericAmount,
    baseCurrency: normalizeCurrency(baseCurrency),
    targetAmount: convertedAmount,
    targetCurrency: normalizeCurrency(targetCurrency),
    exchangeRate: rate,
  };
}

module.exports = {
  getAdminExchangeRate,
  convertFromBaseCurrency,
};

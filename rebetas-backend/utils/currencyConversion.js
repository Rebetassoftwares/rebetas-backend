const convertCurrency = ({ amount, rate, decimals = 2 }) => {
  const numericAmount = Number(amount);
  const numericRate = Number(rate);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Invalid amount supplied for currency conversion");
  }

  if (!Number.isFinite(numericRate) || numericRate <= 0) {
    throw new Error("Invalid exchange rate supplied for currency conversion");
  }

  return Number((numericAmount * numericRate).toFixed(decimals));
};

module.exports = {
  convertCurrency,
};

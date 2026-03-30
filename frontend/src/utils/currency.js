// 🔥 SINGLE SOURCE OF TRUTH

export const currencyMeta = {
  NGN: { symbol: "₦", label: "Nigerian Naira" },
  USD: { symbol: "$", label: "US Dollar" },
  EUR: { symbol: "€", label: "Euro" },
  GBP: { symbol: "£", label: "British Pound" },
  KES: { symbol: "KSh", label: "Kenyan Shilling" },
  ZAR: { symbol: "R", label: "South African Rand" },
  GHS: { symbol: "GH₵", label: "Ghanaian Cedi" },
};

// 🔥 FORMAT FUNCTION (REUSE EVERYWHERE)
export function formatMoney(currency, amount) {
  const meta = currencyMeta[currency];
  const safeAmount = Number(amount || 0);

  return `${meta?.symbol || currency || ""} ${safeAmount.toLocaleString()}`;
}

// 🔥 OPTIONAL (FOR LABELS)
export function getCurrencyLabel(currency) {
  return currencyMeta[currency]?.label || currency;
}

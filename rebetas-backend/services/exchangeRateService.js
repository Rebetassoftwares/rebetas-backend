const axios = require("axios");

const OPEN_EXCHANGE_API = process.env.OPEN_EXCHANGE_API;
const OPEN_EXCHANGE_RATES_APP_ID = process.env.OPEN_EXCHANGE_RATES_APP_ID;

const DEFAULT_BASE_CURRENCY = "USD";

const normalizeCurrency = (currency) => {
  return String(currency || "")
    .trim()
    .toUpperCase();
};

const getExchangeRates = async () => {
  if (!OPEN_EXCHANGE_API || !OPEN_EXCHANGE_RATES_APP_ID) {
    throw new Error("Open Exchange Rates configuration is missing");
  }

  const response = await axios.get(OPEN_EXCHANGE_API, {
    params: {
      app_id: OPEN_EXCHANGE_RATES_APP_ID,
    },
  });

  if (!response.data || !response.data.rates) {
    throw new Error("Invalid exchange rate response");
  }

  return response.data;
};

const getExchangeRate = async ({ fromCurrency, toCurrency }) => {
  const from = normalizeCurrency(fromCurrency);
  const to = normalizeCurrency(toCurrency);

  if (!from || !to) {
    throw new Error("Source and target currencies are required");
  }

  if (from === to) {
    return 1;
  }

  const data = await getExchangeRates();

  const rates = data.rates;
  const base = normalizeCurrency(data.base || DEFAULT_BASE_CURRENCY);

  if (!rates[from] && from !== base) {
    throw new Error(`Exchange rate not available for ${from}`);
  }

  if (!rates[to] && to !== base) {
    throw new Error(`Exchange rate not available for ${to}`);
  }

  const fromRate = from === base ? 1 : Number(rates[from]);
  const toRate = to === base ? 1 : Number(rates[to]);

  return Number((toRate / fromRate).toFixed(8));
};

module.exports = {
  getExchangeRates,
  getExchangeRate,
};

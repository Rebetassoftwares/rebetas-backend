const axios = require("axios");

const BETKING_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  Accept: "application/json, text/plain, */*",
};

const BETKING_ROUNDS_ENDPOINT =
  "https://m.betking.com/en-ng/virtuals/scheduled/leagues";

const BETKING_MATCHES_ENDPOINT =
  "https://m.betking.com/en-ng/virtuals/api/scheduled/leagues/round-events";

async function fetchBetKingRounds() {
  try {
    const response = await axios.get(BETKING_ROUNDS_ENDPOINT, {
      headers: BETKING_HEADERS,
      timeout: 10000,
    });

    return response.data;
  } catch (error) {
    console.error(
      "BetKing rounds fetch error:",
      error?.response?.status || error.message,
    );

    return null;
  }
}

async function fetchBetKingRoundMatches(roundId) {
  try {
    const response = await axios.get(
      `${BETKING_MATCHES_ENDPOINT}?roundId=${roundId}`,
      {
        headers: BETKING_HEADERS,
        timeout: 10000,
      },
    );

    return response.data;
  } catch (error) {
    console.error(
      "BetKing matches fetch error:",
      error?.response?.status || error.message,
    );

    return null;
  }
}

module.exports = {
  fetchBetKingRounds,
  fetchBetKingRoundMatches,
};

const axios = require("axios");
const platforms = require("../../config/platforms");

async function fetchBet9jaFeed() {
  try {
    const endpoint = platforms.bet9ja.endpoints.base;

    const response = await axios.get(endpoint);

    return response.data;
  } catch (error) {
    console.error("Bet9ja API error:", error.message);

    return null;
  }
}

module.exports = {
  fetchBet9jaFeed,
};

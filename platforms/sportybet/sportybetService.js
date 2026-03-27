const axios = require("axios");

async function fetchSportybetFeed() {
  try {
    const response = await axios.get(
      "https://virtual-proxy.virtustec.com/api/client/v0.1/eventBlocks/event/data",
    );

    return response.data;
  } catch (error) {
    console.error("SportyBet API error:", error.message);
    return null;
  }
}

module.exports = {
  fetchSportybetFeed,
};

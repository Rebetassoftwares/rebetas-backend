const { fetchBet9jaFeed } = require("./bet9jaService");
const { parseBet9jaMatches } = require("./bet9jaParser");

async function getBet9jaLeagueData(league) {
  try {
    const rawFeed = await fetchBet9jaFeed();

    if (!rawFeed) return null;

    const matches = parseBet9jaMatches(rawFeed, league);

    if (!matches.length) return null;

    const season = matches[0]?.season;
    const round = matches[0]?.round;

    if (!season && round !== 0) {
      return null;
    }

    return {
      roundId: `${season}_${round}`,
      matches,
    };
  } catch (error) {
    console.error("Bet9ja handler error:", error.message);

    return null;
  }
}

module.exports = {
  getBet9jaLeagueData,
};

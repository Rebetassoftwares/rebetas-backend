const { fetchSportybetFeed } = require("./sportybetService");
const { parseSportybetMatches } = require("./sportybetParser");

async function getSportybetLeagueData(league) {
  try {
    const rawFeed = await fetchSportybetFeed();

    if (!rawFeed) return null;

    const matches = parseSportybetMatches(rawFeed, league);

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
    console.error("SportyBet handler error:", error.message);
    return null;
  }
}

module.exports = {
  getSportybetLeagueData,
};

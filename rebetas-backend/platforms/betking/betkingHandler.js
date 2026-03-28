const {
  fetchBetKingRounds,
  fetchBetKingRoundMatches,
} = require("./betkingService");
const { parseBetKingMatches } = require("./betkingParser");

async function getBetKingLeagueData(league) {
  try {
    // TEMP: hardcode a roundId just to test flow
    const testRoundId = 1; // just for test

    const rawMatches = await fetchBetKingRoundMatches(testRoundId);

    if (!rawMatches) return null;

    const matches = parseBetKingMatches(rawMatches, testRoundId);

    if (!matches.length) return null;

    return {
      roundId: String(testRoundId),
      matches,
    };
  } catch (error) {
    console.error("BetKing handler error:", error.message);
    return null;
  }
}
module.exports = {
  getBetKingLeagueData,
};

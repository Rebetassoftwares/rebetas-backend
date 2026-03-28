const platforms = require("../config/platforms");
const randomMatch = require("../utils/randomMatch");

async function generatePrediction(platformKey, league, matches = []) {
  const platform = platforms[platformKey];

  if (!platform) return null;

  if (!platform.leagues.includes(league)) return null;

  if (!matches.length) return null;

  const selectedMatch = randomMatch(matches);

  if (!selectedMatch) return null;

  return {
    platform: platformKey,
    league,
    matchId: selectedMatch.id,
    homeTeam: selectedMatch.homeTeam,
    awayTeam: selectedMatch.awayTeam,
    match: `${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`,
    prediction: "OVER 1.5",
    odds: selectedMatch.odds,
    stake: null,
    season: selectedMatch.season,
    week: selectedMatch.round,
    generatedAt: Date.now(),
  };
}

module.exports = {
  generatePrediction,
};

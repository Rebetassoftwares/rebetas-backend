const normalizeMatch = require("../shared/normalizeMatch");

function parseBetKingMatches(rawData, roundId) {
  if (!rawData) return [];

  const matches = Array.isArray(rawData) ? rawData : rawData?.events || [];

  const parsedMatches = [];

  for (const match of matches) {
    try {
      const homeTeam = match?.participants?.[0]?.name || "Unknown";
      const awayTeam = match?.participants?.[1]?.name || "Unknown";

      const odds = match?.oddsByMarket?.["7"]?.["57"]?.value;

      if (!odds) continue;

      parsedMatches.push(
        normalizeMatch({
          id: match.id,
          platform: "betking",
          leagueId: match?.leagueId || null,
          season: match?.seasonId || null,
          round: roundId,
          homeTeam,
          awayTeam,
          market: "Over 1.5",
          odds: Number(odds),
          status: "scheduled",
        }),
      );
    } catch (error) {
      console.error("BetKing parse error:", error.message);
    }
  }

  return parsedMatches;
}

module.exports = {
  parseBetKingMatches,
};

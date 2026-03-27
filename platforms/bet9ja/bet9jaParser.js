const platforms = require("../../config/platforms");
const normalizeMatch = require("../shared/normalizeMatch");

function parseBet9jaMatches(apiData, league) {
  if (!apiData || !apiData.doc) return [];

  const matches = [];

  const tournaments =
    apiData.doc?.[0]?.data?.["1"]?.realcategories?.["1111"]?.tournaments;

  if (!tournaments) return [];

  const leagueTournamentId = platforms.bet9ja.tournamentIds?.[league];

  if (!leagueTournamentId) return [];

  Object.values(tournaments).forEach((tournament) => {
    if (Number(tournament._utid) !== Number(leagueTournamentId)) {
      return;
    }

    const tournamentMatches = tournament.matches || {};

    Object.values(tournamentMatches).forEach((match) => {
      const homeTeam = match?.teams?.home?.name || "Unknown";
      const awayTeam = match?.teams?.away?.name || "Unknown";

      matches.push(
        normalizeMatch({
          id: match._id,
          platform: "bet9ja",
          leagueId: tournament._utid,
          season: match._seasonid,
          round: match.round,
          homeTeam,
          awayTeam,
          market: "Over 1.5",
          odds: null,
          status: match.matchstatus,
        }),
      );
    });
  });

  return matches;
}

module.exports = {
  parseBet9jaMatches,
};

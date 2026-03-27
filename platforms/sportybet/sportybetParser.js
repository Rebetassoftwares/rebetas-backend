const normalizeMatch = require("../shared/normalizeMatch");

function parseSportybetMatches(apiData, league) {
  if (!apiData || !apiData.body) return [];

  const matches = [];

  const playlist = apiData.body[0];

  if (!playlist || !playlist.events) return [];

  const champId = playlist.data?.champId;

  playlist.events.forEach((event) => {
    const participants = event.data?.participants || [];

    if (participants.length < 2) return;

    const homeTeam = participants[0]?.name || "Unknown";
    const awayTeam = participants[1]?.name || "Unknown";

    matches.push(
      normalizeMatch({
        id: event.eventId,
        platform: "sportybet",
        leagueId: champId,
        season: champId,
        round: playlist.playlistId,
        homeTeam,
        awayTeam,
        market: "Over 1.5",
        odds: null,
        status: event.serverStatus,
      }),
    );
  });

  return matches;
}

module.exports = {
  parseSportybetMatches,
};

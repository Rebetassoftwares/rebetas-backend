function normalizeMatch({
  id,
  platform,
  leagueId,
  season,
  round,
  homeTeam,
  awayTeam,
  market,
  odds,
  status,
}) {
  return {
    id,
    platform,
    leagueId,
    season,
    round,
    homeTeam,
    awayTeam,
    market,
    odds,
    status,
  };
}

module.exports = normalizeMatch;

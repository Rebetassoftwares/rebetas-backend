const { getBet9jaLeagueData } = require("./bet9ja/bet9jaHandler");
const { getBetKingLeagueData } = require("./betking/betkingHandler");
const { getSportybetLeagueData } = require("./sportybet/sportybetHandler");

const platformRegistry = {
  bet9ja: getBet9jaLeagueData,
  betking: getBetKingLeagueData,
  sportybet: getSportybetLeagueData,
};

function getPlatformHandler(platformKey) {
  return platformRegistry[platformKey] || null;
}

module.exports = {
  getPlatformHandler,
};

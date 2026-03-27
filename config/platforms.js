module.exports = {
  bet9ja: {
    name: "Bet9ja",

    leagues: [
      "Bundesliga",
      "Euro League",
      "English League",
      "Asian Cup",
      "EURO 2024",
      "Nations Cup",
      "World Cup",
      "Champions Cup",
    ],

    tournamentIds: {
      Bundesliga: 34616,
      "Euro League": 14149,
      "English League": 31867,
      "Asian Cup": 26654,
      "EURO 2024": 2448,
      "Nations Cup": 13933,
      "World Cup": 15446,
      "Champions Cup": 28199,
    },

    endpoints: {
      base: "https://virtual.bet9ja.com/feeds/?bet9ja/en/Europe:Berlin/gismo/vfc_stats_round_odds2",
    },
  },

  sportybet: {
    name: "SportyBet",

    leagues: ["England", "Germany", "Spain", "Italy"],

    champIds: {
      England: 7558,
      Germany: 7557,
      Spain: 8446,
      Italy: 8447,
    },

    endpoints: {
      events: "/eventBlocks/event/data",
      results: "/eventBlocks/event/result",
      stats: "/eventBlocks/stats",
    },
  },

  betking: {
    name: "BetKing",

    leagues: ["kings-league", "kings-liga", "kings-italiano", "kings-bundliga"],

    endpoints: {
      rounds: "https://m.betking.com/en-ng/virtuals/scheduled/leagues",

      matches:
        "https://m.betking.com/en-ng/virtuals/api/scheduled/leagues/round-events",
    },
  },
};

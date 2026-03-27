function extractScores(matchData) {
  if (!matchData || typeof matchData !== "object") {
    return { homeScore: null, awayScore: null };
  }

  const possiblePairs = [
    { home: matchData?.result?.home, away: matchData?.result?.away },

    { home: matchData?.result?.homeScore, away: matchData?.result?.awayScore },

    { home: matchData?.home_score, away: matchData?.away_score },

    { home: matchData?.homeScore, away: matchData?.awayScore },

    {
      home: matchData?.sport_event_status?.home_score,
      away: matchData?.sport_event_status?.away_score,
    },

    /* NEW — Sportradar format */

    {
      home: matchData?.periods?.ft?.home,
      away: matchData?.periods?.ft?.away,
    },
  ];

  for (const pair of possiblePairs) {
    const homeScore =
      pair.home !== undefined && pair.home !== null ? Number(pair.home) : null;

    const awayScore =
      pair.away !== undefined && pair.away !== null ? Number(pair.away) : null;

    if (
      homeScore !== null &&
      awayScore !== null &&
      !Number.isNaN(homeScore) &&
      !Number.isNaN(awayScore)
    ) {
      return { homeScore, awayScore };
    }
  }

  return { homeScore: null, awayScore: null };
}

function evaluatePrediction(prediction, matchData) {
  try {
    const { homeScore, awayScore } = extractScores(matchData);

    if (homeScore === null || awayScore === null) {
      return {
        status: "PENDING",
        homeScore: null,
        awayScore: null,
        totalGoals: null,
        win: null,
        resultAmount: null,
        profit: null,
      };
    }

    const totalGoals = homeScore + awayScore;

    let win = false;

    if (prediction.prediction === "OVER 1.5") {
      win = totalGoals > 1;
    }

    const stake = Number(prediction.stake || 0);
    const odds = Number(prediction.odds || 0);

    const resultAmount = win ? Math.round(stake * odds) : 0;
    const profit = resultAmount - stake;

    return {
      status: win ? "WIN" : "LOSS",
      homeScore,
      awayScore,
      totalGoals,
      win,
      resultAmount,
      profit,
    };
  } catch (error) {
    console.error("Evaluation error:", error.message);

    return {
      status: "PENDING",
      homeScore: null,
      awayScore: null,
      totalGoals: null,
      win: null,
      resultAmount: null,
      profit: null,
    };
  }
}

module.exports = {
  evaluatePrediction,
};

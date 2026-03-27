const platforms = require("../config/platforms");
const { generatePrediction } = require("./predictionEngine");
const { evaluatePrediction } = require("./resultEngine");
const { storePrediction } = require("../controllers/historyController");
const { getPlatformHandler } = require("../platforms/platformRegistry");
const SystemState = require("../models/SystemState");

const latestPredictions = {};
const lastRoundTracker = {};
const martingaleState = {};

const CHECK_INTERVAL = 15000;

function calculateBaseStake(capital, baseStakePercent) {
  const percent = baseStakePercent / 100;
  return Math.round(capital * percent);
}

function startRoundScheduler() {
  setInterval(async () => {
    try {
      const systemState = await SystemState.findOne({ key: "main" });

      if (!systemState) {
        console.error("System state not initialized");
        return;
      }

      for (const platformKey in platforms) {
        const platform = platforms[platformKey];
        const leagues = platform.leagues || [];

        for (const league of leagues) {
          try {
            const trackerKey = `${platformKey}_${league}`;
            const handler = getPlatformHandler(platformKey);

            if (!handler) continue;

            const leagueData = await handler(league);

            if (!leagueData || !leagueData.roundId) continue;

            const { roundId, matches } = leagueData;

            if (!Array.isArray(matches) || !matches.length) continue;

            if (!lastRoundTracker[trackerKey]) {
              lastRoundTracker[trackerKey] = roundId;

              martingaleState[trackerKey] = calculateBaseStake(
                systemState.capital,
                systemState.baseStakePercent,
              );

              const initialPrediction = await generatePrediction(
                platformKey,
                league,
                matches,
              );

              if (initialPrediction) {
                initialPrediction.stake = martingaleState[trackerKey];
                latestPredictions[trackerKey] = initialPrediction;
              }

              continue;
            }

            if (lastRoundTracker[trackerKey] !== roundId) {
              const previousPrediction = latestPredictions[trackerKey];

              if (
                previousPrediction &&
                systemState.bettingSimulationActive === true
              ) {
                const selectedMatch = findMatchById(
                  matches,
                  previousPrediction.matchId,
                );

                if (selectedMatch) {
                  const evaluation = evaluatePrediction(
                    previousPrediction,
                    selectedMatch,
                  );

                  if (evaluation.status !== "PENDING") {
                    systemState.capital += evaluation.profit;
                    await systemState.save();

                    const resolvedDate = new Date();

                    await storePrediction({
                      platform: previousPrediction.platform,
                      league: previousPrediction.league,
                      season: previousPrediction.season,
                      week: previousPrediction.week,
                      matchId: previousPrediction.matchId,
                      match: previousPrediction.match,
                      prediction: previousPrediction.prediction,
                      date: resolvedDate.toISOString().split("T")[0],
                      month: resolvedDate.toLocaleString("default", {
                        month: "long",
                      }),
                      odd: previousPrediction.odds,
                      stake: previousPrediction.stake,
                      resultAmount: evaluation.resultAmount,
                      profit: evaluation.profit,
                      capitalAfter: systemState.capital,
                      resultStatus: evaluation.status,
                      homeScore: evaluation.homeScore,
                      awayScore: evaluation.awayScore,
                    });

                    if (evaluation.win) {
                      martingaleState[trackerKey] = calculateBaseStake(
                        systemState.capital,
                        systemState.baseStakePercent,
                      );
                    } else {
                      const nextStake =
                        martingaleState[trackerKey] * systemState.multiplier;

                      martingaleState[trackerKey] =
                        nextStake > systemState.capital
                          ? calculateBaseStake(
                              systemState.capital,
                              systemState.baseStakePercent,
                            )
                          : nextStake;
                    }
                  }
                }
              }

              lastRoundTracker[trackerKey] = roundId;

              const prediction = await generatePrediction(
                platformKey,
                league,
                matches,
              );

              if (prediction) {
                prediction.stake =
                  martingaleState[trackerKey] ||
                  calculateBaseStake(
                    systemState.capital,
                    systemState.baseStakePercent,
                  );

                latestPredictions[trackerKey] = prediction;
              }
            }
          } catch (error) {
            console.error("Round scheduler error:", error.message);
          }
        }
      }
    } catch (error) {
      console.error("Scheduler system state error:", error.message);
    }
  }, CHECK_INTERVAL);
}

function getLatestPrediction(platform, league) {
  const key = `${String(platform).toLowerCase()}_${league}`;
  return latestPredictions[key] || null;
}

function findMatchById(matches, matchId) {
  if (!Array.isArray(matches) || !matchId) return null;
  return matches.find((match) => match?.id === matchId) || null;
}

module.exports = {
  startRoundScheduler,
  getLatestPrediction,
};

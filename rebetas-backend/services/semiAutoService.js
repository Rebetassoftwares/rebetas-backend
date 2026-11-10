const ManualLeague = require("../models/ManualLeague");
const ManualPrediction = require("../models/ManualPrediction");
const SystemState = require("../models/SystemState");

const { getStake } = require("./martingaleService");
const { calculateCycles } = require("../utils/cycleCalculator");

const {
  settlePreviousSemiAutoPredictions,
} = require("./semiAutoSettlementService");

function pickRandomOdd(min, max) {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(2));
}

function pickRandomTeam(teams) {
  const index = Math.floor(Math.random() * teams.length);
  return teams[index];
}

function getNextPredictionPick(lastPrediction) {
  if (!lastPrediction) return "Over 2.5";

  return lastPrediction.prediction === "Over 2.5" ? "Under 2.5" : "Over 2.5";
}

async function runSemiAuto() {
  try {
    const now = new Date();

    const systemState = await SystemState.findOne({ key: "main" });

    if (!systemState) {
      console.error("Semi-auto error: System state not initialized");
      return;
    }

    const leagues = await ManualLeague.find({
      mode: "SEMI_AUTO",
      isActive: true,
    });

    for (const league of leagues) {
      try {
        if (!Array.isArray(league.teams) || league.teams.length < 1) {
          continue;
        }

        if (
          !league.oddRange ||
          !Number.isFinite(Number(league.oddRange.min)) ||
          !Number.isFinite(Number(league.oddRange.max))
        ) {
          continue;
        }

        const firstTime = new Date(league.firstPredictionTime);

        if (Number.isNaN(firstTime.getTime())) {
          continue;
        }

        if (now < firstTime) {
          continue;
        }

        const intervalMinutes = Number(league.intervalMinutes || 0);
        const intervalSeconds = Number(league.intervalSeconds || 0);

        const intervalMs = intervalMinutes * 60 * 1000 + intervalSeconds * 1000;

        if (!intervalMs || intervalMs < 1000) {
          continue;
        }

        // Calculate only the current prediction slot.
        const elapsed = now.getTime() - firstTime.getTime();
        const slotIndex = Math.floor(elapsed / intervalMs);

        const scheduledFor = new Date(
          firstTime.getTime() + slotIndex * intervalMs,
        );

        // Prevent duplicate predictions for the current slot.
        const existing = await ManualPrediction.findOne({
          leagueId: league._id,
          type: "SEMI_AUTO",
          scheduledFor,
        });

        if (existing) {
          continue;
        }

        // Settle older predictions before creating the next prediction.
        try {
          await settlePreviousSemiAutoPredictions(league, scheduledFor);
        } catch (settlementError) {
          console.error(
            `Semi-auto settlement error (${league.platform} - ${league.leagueName}):`,
            settlementError,
          );
        }

        // Reload the league to get administrator-configured capital.
        const currentLeague = await ManualLeague.findById(league._id);

        if (!currentLeague || !currentLeague.isActive) {
          continue;
        }

        const team = pickRandomTeam(currentLeague.teams);

        const odd = pickRandomOdd(
          Number(currentLeague.oddRange.min),
          Number(currentLeague.oddRange.max),
        );

        // FIXED-CAPITAL FLAT STAKING.
        //
        // ManualLeague.capital is the administrator-set capital.
        // Settlement does not increase or decrease this value.
        //
        // Every prediction uses the same percentage of this capital.
        const capital = Number(currentLeague.capital);
        const basePercent = Number(systemState.baseStakePercent);

        if (
          !Number.isFinite(capital) ||
          capital < 0 ||
          !Number.isFinite(basePercent) ||
          basePercent < 0
        ) {
          console.error(
            `Invalid stake inputs (${currentLeague.platform} - ${currentLeague.leagueName})`,
            { capital, basePercent },
          );
          continue;
        }

        const stake = getStake(capital, basePercent);

        const lastPrediction = await ManualPrediction.findOne({
          leagueId: currentLeague._id,
          type: "SEMI_AUTO",
        }).sort({ scheduledFor: -1 });

        const nextPredictionPick = getNextPredictionPick(lastPrediction);

        const shouldReset =
          !lastPrediction ||
          (currentLeague.lastUpdatedAt &&
            new Date(currentLeague.lastUpdatedAt) >
              new Date(lastPrediction.createdAt));

        let cycles;

        if (shouldReset) {
          cycles = calculateCycles(currentLeague, null);
        } else {
          cycles = calculateCycles(currentLeague, lastPrediction.cycles);
        }

        await ManualPrediction.create({
          leagueId: currentLeague._id,
          platform: currentLeague.platform,
          leagueName: currentLeague.leagueName,
          type: "SEMI_AUTO",
          team: team.name,
          odd,
          stake,
          scheduledFor,
          cycles,
          prediction: nextPredictionPick,
          status: "pending",
        });
      } catch (err) {
        console.error(
          `Semi-auto league error (${league.platform} - ${league.leagueName}):`,
          err,
        );
      }
    }
  } catch (err) {
    console.error("Semi-auto service error:", err);
  }
}

module.exports = runSemiAuto;

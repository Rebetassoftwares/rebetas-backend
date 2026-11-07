const ManualLeague = require("../models/ManualLeague");
const ManualPrediction = require("../models/ManualPrediction");
const SystemState = require("../models/SystemState");

const { getStake } = require("./martingaleService");
const { calculateCycles } = require("../utils/cycleCalculator");

const {
  settlePreviousSemiAutoPredictions,
} = require("./semiAutoSettlementService");

// Prevent overlapping scheduler executions in this Node.js process.
let isRunning = false;

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
  if (isRunning) return;

  isRunning = true;

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
        if (!Array.isArray(league.teams) || league.teams.length < 1) continue;

        if (
          !league.oddRange ||
          !Number.isFinite(Number(league.oddRange.min)) ||
          !Number.isFinite(Number(league.oddRange.max)) ||
          Number(league.oddRange.min) <= 0 ||
          Number(league.oddRange.max) <= Number(league.oddRange.min)
        ) {
          continue;
        }

        const firstTime = new Date(league.firstPredictionTime);
        if (Number.isNaN(firstTime.getTime()) || now < firstTime) continue;

        const intervalMinutes = Number(league.intervalMinutes || 0);
        const intervalSeconds = Number(league.intervalSeconds || 0);
        const intervalMs = intervalMinutes * 60 * 1000 + intervalSeconds * 1000;

        if (!Number.isFinite(intervalMs) || intervalMs < 1000) continue;

        const elapsed = now.getTime() - firstTime.getTime();
        const currentSlotIndex = Math.floor(elapsed / intervalMs);

        // Process slots chronologically, including missed slots after downtime.
        for (let slotIndex = 0; slotIndex <= currentSlotIndex; slotIndex++) {
          const scheduledFor = new Date(
            firstTime.getTime() + slotIndex * intervalMs,
          );

          // Settle older SEMI_AUTO predictions before calculating this slot's stake.
          await settlePreviousSemiAutoPredictions(league, scheduledFor);

          const existing = await ManualPrediction.findOne({
            leagueId: league._id,
            type: "SEMI_AUTO",
            scheduledFor,
          });

          if (existing) continue;

          const lastPrediction = await ManualPrediction.findOne({
            leagueId: league._id,
            type: "SEMI_AUTO",
            scheduledFor: { $lt: scheduledFor },
          }).sort({
            scheduledFor: -1,
            createdAt: -1,
          });

          const capital = Number(league.capital);
          const basePercent = Number(systemState.baseStakePercent);

          if (
            !Number.isFinite(capital) ||
            !Number.isFinite(basePercent) ||
            capital < 0 ||
            basePercent < 0
          ) {
            console.error(
              `Invalid stake inputs (${league.platform} - ${league.leagueName})`,
              { capital, basePercent },
            );
            continue;
          }

          // Same configured percentage of the league's current capital.
          const stake = getStake(capital, basePercent);
          const team = pickRandomTeam(league.teams);
          const odd = pickRandomOdd(
            Number(league.oddRange.min),
            Number(league.oddRange.max),
          );
          const nextPredictionPick = getNextPredictionPick(lastPrediction);

          const shouldReset =
            !lastPrediction ||
            (league.lastUpdatedAt &&
              new Date(league.lastUpdatedAt) >
                new Date(lastPrediction.createdAt));

          const cycles = shouldReset
            ? calculateCycles(league, null)
            : calculateCycles(league, lastPrediction.cycles);

          await ManualPrediction.create({
            leagueId: league._id,
            platform: league.platform,
            leagueName: league.leagueName,
            type: "SEMI_AUTO",
            team: team.name,
            odd,
            stake,
            scheduledFor,
            cycles,
            prediction: nextPredictionPick,
            status: "pending",
          });
        }
      } catch (err) {
        console.error(
          `Semi-auto league error (${league.platform} - ${league.leagueName}):`,
          err,
        );
      }
    }
  } catch (err) {
    console.error("Semi-auto service error:", err);
  } finally {
    isRunning = false;
  }
}

module.exports = runSemiAuto;

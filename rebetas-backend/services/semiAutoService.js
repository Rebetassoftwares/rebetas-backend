const ManualLeague = require("../models/ManualLeague");
const ManualPrediction = require("../models/ManualPrediction");
const SystemState = require("../models/SystemState");
const { getStake, getTrackerKey } = require("./martingaleService");
const { calculateCycles } = require("../utils/cycleCalculator");

function pickRandomOdd(min, max) {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(2));
}

function pickRandomTeam(teams) {
  const index = Math.floor(Math.random() * teams.length);
  return teams[index];
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

        const intervalMs = Number(league.intervalMinutes) * 60 * 1000;
        if (!intervalMs || intervalMs < 1) {
          continue;
        }

        const elapsed = now.getTime() - firstTime.getTime();
        const slotIndex = Math.floor(elapsed / intervalMs);
        const scheduledFor = new Date(
          firstTime.getTime() + slotIndex * intervalMs,
        );

        const existing = await ManualPrediction.findOne({
          leagueId: league._id,
          type: "SEMI_AUTO",
          scheduledFor,
        });

        if (existing) {
          continue;
        }

        const team = pickRandomTeam(league.teams);
        const odd = pickRandomOdd(
          Number(league.oddRange.min),
          Number(league.oddRange.max),
        );

        const trackerKey = getTrackerKey(league.platform, league.leagueName);
        const stake = getStake(trackerKey, systemState);

        const cycles = calculateCycles(league, scheduledFor);

        await ManualPrediction.create({
          leagueId: league._id,
          platform: league.platform,
          leagueName: league.leagueName,
          type: "SEMI_AUTO",
          team: team.name,
          odd,
          stake,
          scheduledFor,
          cycles, // 🔥 add this line only
          status: "pending",
        });
      } catch (err) {
        console.error(
          `Semi-auto league error (${league.platform} - ${league.leagueName}):`,
          err.message,
        );
      }
    }
  } catch (err) {
    console.error("Semi-auto service error:", err);
  }
}

module.exports = runSemiAuto;

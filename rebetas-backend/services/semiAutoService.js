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

// 🔥 NEW: advance cycles (STATE-DRIVEN)
function advanceCycles(cycleConfig) {
  if (!Array.isArray(cycleConfig)) return cycleConfig;

  const updated = cycleConfig.map((c) => ({ ...c }));

  let carry = 1; // 🔥 start with increment

  for (let i = updated.length - 1; i >= 0; i--) {
    if (!carry) break;

    const c = updated[i];

    const start = Number(c.start || 0);
    let current =
      c.current !== undefined && c.current !== null ? Number(c.current) : start;

    current += carry;

    // no max → just assign and stop
    if (!c.max) {
      c.current = current;
      carry = 0;
      break;
    }

    const max = Number(c.max);

    if (current <= max) {
      c.current = current;
      carry = 0; // stop propagation
    } else {
      c.current = start || 1;
      carry = 1; // propagate to parent
    }
  }

  return updated;
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

        const elapsed = now.getTime() - firstTime.getTime();

        if (elapsed < 0) continue;

        const slotIndex = Math.floor(elapsed / intervalMs);
        const scheduledFor = new Date(
          firstTime.getTime() + slotIndex * intervalMs,
        );

        const lastPrediction = await ManualPrediction.findOne({
          leagueId: league._id,
          type: "SEMI_AUTO",
        }).sort({ scheduledFor: -1 });

        if (lastPrediction && lastPrediction.scheduledFor >= scheduledFor) {
          continue;
        }

        const team = pickRandomTeam(league.teams);
        const odd = pickRandomOdd(
          Number(league.oddRange.min),
          Number(league.oddRange.max),
        );

        const trackerKey = getTrackerKey(league.platform, league.leagueName);
        const stake = getStake(trackerKey, systemState);

        // 🔥 FIXED: cycles are now STATE-based (no time shifting)
        const cycles = calculateCycles(league);

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
          prediction: "Over 1.5",
          status: "pending",
        });

        // 🔥 CRITICAL: advance and persist cycles AFTER prediction
        league.cycleConfig = advanceCycles(league.cycleConfig);
        await league.save();
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

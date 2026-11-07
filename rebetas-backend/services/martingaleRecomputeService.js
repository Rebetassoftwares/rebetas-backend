const ManualPrediction = require("../models/ManualPrediction");
const ManualLeague = require("../models/ManualLeague");
const SystemState = require("../models/SystemState");
const { calculateBaseStake } = require("./martingaleService");

async function recomputeMartingale(platform, leagueName) {
  try {
    const systemState = await SystemState.findOne({ key: "main" });

    if (!systemState) {
      console.error("Martingale recompute: system state not found");
      return;
    }

    const normalizedPlatform = String(platform).toLowerCase();
    const normalizedLeague = String(leagueName).trim();

    // This recomputation is strictly for MANUAL leagues.
    const league = await ManualLeague.findOne({
      platform: new RegExp(`^${normalizedPlatform}$`, "i"),
      leagueName: new RegExp(`^${normalizedLeague}$`, "i"),
      mode: "MANUAL",
    });

    if (!league) {
      console.error("Martingale recompute: MANUAL league not found");
      return;
    }

    // Snapshot capital.
    let capital =
      Number(league.capital) > 0
        ? Number(league.capital)
        : Number(systemState.initialCapital || 0);

    let currentStake = calculateBaseStake(
      capital,
      systemState.baseStakePercent,
    );

    // CRITICAL: Only retrieve MANUAL predictions.
    const predictions = await ManualPrediction.find({
      platform: new RegExp(`^${normalizedPlatform}$`, "i"),
      leagueName: new RegExp(`^${normalizedLeague}$`, "i"),
      type: "MANUAL",
      status: { $in: ["won", "loss"] },
    }).sort({
      scheduledFor: 1,
      createdAt: 1,
    });

    // Store changes first.
    const updates = [];

    for (const p of predictions) {
      const stake = Number(currentStake || 0);
      const odd = Number(p.odd || 0);

      let resultAmount = 0;
      let profit = 0;

      if (p.status === "won") {
        resultAmount = Number((stake * odd).toFixed(2));
        profit = Number((resultAmount - stake).toFixed(2));

        capital += profit;

        currentStake = calculateBaseStake(
          capital,
          systemState.baseStakePercent,
        );
      } else {
        resultAmount = 0;
        profit = -stake;

        capital += profit;

        const nextStake = stake * Number(systemState.multiplier || 1);

        currentStake =
          nextStake > capital
            ? calculateBaseStake(capital, systemState.baseStakePercent)
            : nextStake;
      }

      updates.push({
        _id: p._id,
        stake,
        resultAmount,
        profit,
        capitalAfter: capital,
        resultStatus: p.status === "won" ? "WIN" : "LOSS",
      });
    }

    // Apply updates only to MANUAL predictions.
    for (const u of updates) {
      await ManualPrediction.updateOne(
        {
          _id: u._id,
          type: "MANUAL",
        },
        {
          $set: {
            stake: u.stake,
            resultAmount: u.resultAmount,
            profit: u.profit,
            capitalAfter: u.capitalAfter,
            resultStatus: u.resultStatus,
          },
        },
      );
    }

    // Save MANUAL league capital.
    league.capital = capital;
    await league.save();

    return true;
  } catch (error) {
    console.error("Martingale recompute error:", error.message);
    return false;
  }
}

module.exports = {
  recomputeMartingale,
};

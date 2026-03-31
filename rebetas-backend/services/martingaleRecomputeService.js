const ManualPrediction = require("../models/ManualPrediction");
const SystemState = require("../models/SystemState");
const { calculateBaseStake } = require("./martingaleService");

async function recomputeMartingale(platform, leagueName) {
  try {
    const systemState = await SystemState.findOne({ key: "main" });

    if (!systemState) {
      console.error("Martingale recompute: system state not found");
      return;
    }

    // ✅ normalize inputs (CRITICAL)
    const normalizedPlatform = String(platform).toLowerCase();
    const normalizedLeague = String(leagueName).trim();

    // 🔥 ALWAYS START FROM BASELINE
    let capital = Number(systemState.initialCapital || 0);

    // 🔥 prevent zero capital crash
    if (capital <= 0) {
      capital = Number(systemState.initialCapital || 0);
    }

    let currentStake = calculateBaseStake(
      capital,
      systemState.baseStakePercent,
    );

    // 🔥 FETCH ALL RESOLVED PREDICTIONS IN ORDER
    const predictions = await ManualPrediction.find({
      platform: {
        $regex: new RegExp(`^${platform}$`, "i"),
      },
      leagueName: {
        $regex: new RegExp(`^${leagueName}$`, "i"),
      },
      status: { $in: ["won", "loss"] },
    }).sort({
      scheduledFor: 1,
      createdAt: 1,
    });

    for (const p of predictions) {
      // 🔥 APPLY CURRENT STAKE
      p.stake = currentStake;

      const stake = Number(currentStake || 0);
      const odd = Number(p.odd || 0);

      let resultAmount = 0;
      let profit = 0;

      if (p.status === "won") {
        resultAmount = Math.round(stake * odd);
        profit = resultAmount - stake;

        capital += profit;

        // ✅ RESET AFTER WIN
        currentStake = calculateBaseStake(
          capital,
          systemState.baseStakePercent,
        );
      } else {
        // LOSS
        resultAmount = 0;
        profit = -stake;

        capital += profit;

        const nextStake = stake * Number(systemState.multiplier || 1);

        currentStake =
          nextStake > capital
            ? calculateBaseStake(capital, systemState.baseStakePercent)
            : nextStake;
      }

      // 🔥 UPDATE RECORD
      p.resultAmount = resultAmount;
      p.profit = profit;
      p.resultStatus = p.status === "won" ? "WIN" : "LOSS";
      p.capitalAfter = capital;

      await p.save();
    }

    // 🔥 UPDATE GLOBAL CAPITAL
    systemState.capital = capital;
    await systemState.save();

    return true;
  } catch (error) {
    console.error("Martingale recompute error:", error.message);
    return false;
  }
}

module.exports = {
  recomputeMartingale,
};

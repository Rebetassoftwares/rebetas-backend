const ManualPrediction = require("../models/ManualPrediction");
const ManualLeague = require("../models/ManualLeague");
const SystemState = require("../models/SystemState");

const { getStake } = require("./martingaleService");

/**
 * Recalculate the complete SEMI_AUTO prediction history
 * from a supplied starting capital.
 *
 * Existing outcomes and odds are preserved.
 * Pending predictions remain pending.
 */
async function recomputeSemiAutoHistory(leagueId, startingCapital) {
  const league = await ManualLeague.findOne({
    _id: leagueId,
    mode: "SEMI_AUTO",
  });

  if (!league) {
    throw new Error("SEMI_AUTO league not found");
  }

  const systemState = await SystemState.findOne({ key: "main" });

  if (!systemState) {
    throw new Error("System state not initialized");
  }

  const baseStakePercent = Number(systemState.baseStakePercent);

  if (!Number.isFinite(baseStakePercent) || baseStakePercent < 0) {
    throw new Error("Invalid base stake percentage");
  }

  let runningCapital = Number(startingCapital);

  if (!Number.isFinite(runningCapital) || runningCapital < 0) {
    throw new Error("Invalid starting capital");
  }

  runningCapital = Number(runningCapital.toFixed(2));

  // Retrieve ALL predictions, including those created before reset.
  const predictions = await ManualPrediction.find({
    leagueId: league._id,
    type: "SEMI_AUTO",
  }).sort({
    scheduledFor: 1,
    createdAt: 1,
    _id: 1,
  });

  const operations = [];

  for (const prediction of predictions) {
    const odd = Number(prediction.odd);

    if (!Number.isFinite(odd) || odd <= 0) {
      throw new Error(`Invalid odd on SEMI_AUTO prediction ${prediction._id}`);
    }

    // Recalculate stake using the current running capital.
    const stake = getStake(runningCapital, baseStakePercent);

    let resultAmount = 0;
    let profit = 0;

    if (prediction.status === "won") {
      resultAmount = Number((stake * odd).toFixed(2));
      profit = Number((resultAmount - stake).toFixed(2));

      runningCapital = Number((runningCapital + profit).toFixed(2));
    } else if (prediction.status === "loss") {
      resultAmount = 0;
      profit = Number((-stake).toFixed(2));

      runningCapital = Number((runningCapital + profit).toFixed(2));
    } else if (prediction.status === "pending") {
      // Pending predictions do not change capital.
      resultAmount = 0;
      profit = 0;
    } else {
      throw new Error(`Unknown prediction status on ${prediction._id}`);
    }

    operations.push({
      updateOne: {
        filter: { _id: prediction._id },
        update: {
          $set: {
            stake,
            resultAmount,
            profit,
            capitalAfter: runningCapital,
          },
        },
      },
    });
  }

  // Update all recalculated prediction records.
  if (operations.length > 0) {
    await ManualPrediction.bulkWrite(operations, {
      ordered: true,
    });
  }

  // Save the final recalculated balance as league capital.
  await ManualLeague.updateOne(
    { _id: league._id, mode: "SEMI_AUTO" },
    {
      $set: {
        capital: runningCapital,
      },
    },
  );

  return {
    leagueId: league._id,
    predictionsRecalculated: predictions.length,
    startingCapital: Number(startingCapital),
    finalCapital: runningCapital,
  };
}

module.exports = {
  recomputeSemiAutoHistory,
};

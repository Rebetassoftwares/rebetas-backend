const ManualPrediction = require("../models/ManualPrediction");
const ManualLeague = require("../models/ManualLeague");
const SystemState = require("../models/SystemState");

const { getStake } = require("./martingaleService");

/**
 * Recalculate complete SEMI_AUTO prediction history
 * using fixed administrator capital.
 *
 * - Stake remains fixed for every prediction.
 * - Existing outcomes and odds are preserved.
 * - Pending predictions remain pending.
 * - Profit/loss is recalculated.
 * - capitalAfter represents the performance balance.
 * - ManualLeague.capital is never increased by profit.
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

  const fixedCapital = Number(startingCapital);

  if (!Number.isFinite(fixedCapital) || fixedCapital < 0) {
    throw new Error("Invalid starting capital");
  }

  // Every prediction uses this same stake.
  const fixedStake = getStake(fixedCapital, baseStakePercent);

  // Performance balance changes, but configured capital does not.
  let runningBalance = Number(fixedCapital.toFixed(2));

  // Retrieve all SEMI_AUTO predictions, including those before reset.
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

    let resultAmount = 0;
    let profit = 0;

    if (prediction.status === "won") {
      resultAmount = Number((fixedStake * odd).toFixed(2));
      profit = Number((resultAmount - fixedStake).toFixed(2));

      runningBalance = Number((runningBalance + profit).toFixed(2));
    } else if (prediction.status === "loss") {
      resultAmount = 0;
      profit = Number((-fixedStake).toFixed(2));

      runningBalance = Number((runningBalance + profit).toFixed(2));
    } else if (prediction.status === "pending") {
      // Pending predictions do not affect performance balance.
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
            stake: fixedStake,
            resultAmount,
            profit,
            capitalAfter: runningBalance,
          },
        },
      },
    });
  }

  // Save recalculated prediction records.
  if (operations.length > 0) {
    await ManualPrediction.bulkWrite(operations, {
      ordered: true,
    });
  }

  // IMPORTANT:
  // Do not overwrite ManualLeague.capital with runningBalance.
  //
  // The administrator-set capital remains fixed.

  return {
    leagueId: league._id,
    predictionsRecalculated: predictions.length,
    startingCapital: fixedCapital,
    fixedStake,
    finalCapital: runningBalance,
  };
}

module.exports = {
  recomputeSemiAutoHistory,
};

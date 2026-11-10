const ManualPrediction = require("../models/ManualPrediction");
const ManualLeague = require("../models/ManualLeague");

const WIN_PROBABILITY = 85;

/**
 * Assign a simulated SEMI_AUTO result:
 * 85% win probability and 15% loss probability.
 */
function assignResult() {
  return Math.random() * 100 < WIN_PROBABILITY ? "won" : "loss";
}

/**
 * Settle one SEMI_AUTO prediction.
 *
 * IMPORTANT:
 * - ManualLeague.capital remains unchanged.
 * - Stake is not recalculated here.
 * - Profit/loss is recorded on the prediction.
 * - capitalAfter tracks the performance balance.
 */
async function settleSemiAutoPrediction(prediction, league) {
  if (
    !prediction ||
    prediction.type !== "SEMI_AUTO" ||
    prediction.status !== "pending" ||
    !league ||
    league.mode !== "SEMI_AUTO"
  ) {
    return false;
  }

  const stake = Number(prediction.stake);
  const odd = Number(prediction.odd);

  if (
    !Number.isFinite(stake) ||
    stake < 0 ||
    !Number.isFinite(odd) ||
    odd <= 0
  ) {
    throw new Error(`Invalid prediction stake or odd: ${prediction._id}`);
  }

  const currentLeague = await ManualLeague.findOne({
    _id: league._id,
    mode: "SEMI_AUTO",
  });

  if (!currentLeague) {
    throw new Error("SEMI_AUTO league not found");
  }

  const status = assignResult();

  const resultAmount = status === "won" ? Number((stake * odd).toFixed(2)) : 0;

  const profit =
    status === "won"
      ? Number((resultAmount - stake).toFixed(2))
      : Number((-stake).toFixed(2));

  // Claim the prediction first to prevent duplicate settlement.
  const updatedPrediction = await ManualPrediction.findOneAndUpdate(
    {
      _id: prediction._id,
      leagueId: league._id,
      type: "SEMI_AUTO",
      status: "pending",
    },
    {
      $set: {
        status,
        resultAmount,
        profit,
      },
    },
    { new: true },
  );

  if (!updatedPrediction) return false;

  try {
    // Find the previous settled prediction chronologically.
    const previousPrediction = await ManualPrediction.findOne({
      leagueId: league._id,
      type: "SEMI_AUTO",
      status: { $in: ["won", "loss"] },
      scheduledFor: { $lt: prediction.scheduledFor },
      _id: { $ne: prediction._id },
    }).sort({
      scheduledFor: -1,
      createdAt: -1,
    });

    // Start from administrator-set capital if this is the first result.
    const previousBalance =
      previousPrediction?.capitalAfter != null
        ? Number(previousPrediction.capitalAfter)
        : Number(currentLeague.capital || 0);

    // Performance balance changes, but league capital does not.
    updatedPrediction.capitalAfter = Number(
      (previousBalance + profit).toFixed(2),
    );

    await updatedPrediction.save();

    return updatedPrediction;
  } catch (error) {
    // Restore pending status if recording the performance balance fails.
    await ManualPrediction.updateOne(
      {
        _id: prediction._id,
        leagueId: league._id,
        type: "SEMI_AUTO",
        status,
      },
      {
        $set: {
          status: "pending",
          resultAmount: 0,
          profit: 0,
          capitalAfter: 0,
        },
      },
    );

    throw error;
  }
}

/**
 * Settle all older pending SEMI_AUTO predictions
 * when the next prediction slot arrives.
 */
async function settlePreviousSemiAutoPredictions(league, nextScheduledFor) {
  if (!league || league.mode !== "SEMI_AUTO" || !nextScheduledFor) {
    return [];
  }

  const pendingPredictions = await ManualPrediction.find({
    leagueId: league._id,
    type: "SEMI_AUTO",
    status: "pending",
    scheduledFor: { $lt: new Date(nextScheduledFor) },
  }).sort({
    scheduledFor: 1,
    createdAt: 1,
  });

  const settled = [];

  for (const prediction of pendingPredictions) {
    const result = await settleSemiAutoPrediction(prediction, league);

    if (result) settled.push(result);
  }

  return settled;
}

module.exports = {
  settleSemiAutoPrediction,
  settlePreviousSemiAutoPredictions,
};

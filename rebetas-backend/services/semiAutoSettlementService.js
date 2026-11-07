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
 * Settle one SEMI_AUTO prediction and apply its profit/loss to league capital.
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

  if (!currentLeague) throw new Error("SEMI_AUTO league not found");

  const status = assignResult();
  const resultAmount = status === "won" ? Number((stake * odd).toFixed(2)) : 0;

  const profit =
    status === "won"
      ? Number((resultAmount - stake).toFixed(2))
      : Number((-stake).toFixed(2));

  // Claim it first so another scheduler pass cannot settle it again.
  const updatedPrediction = await ManualPrediction.findOneAndUpdate(
    {
      _id: prediction._id,
      leagueId: league._id,
      type: "SEMI_AUTO",
      status: "pending",
    },
    {
      $set: { status, resultAmount, profit },
    },
    { new: true },
  );

  if (!updatedPrediction) return false;

  let capitalWasUpdated = false;

  try {
    const updatedLeague = await ManualLeague.findOneAndUpdate(
      { _id: league._id, mode: "SEMI_AUTO" },
      { $inc: { capital: profit } },
      { new: true },
    );

    if (!updatedLeague) {
      throw new Error("Failed to update SEMI_AUTO league capital");
    }

    capitalWasUpdated = true;

    updatedPrediction.capitalAfter = Number(
      Number(updatedLeague.capital).toFixed(2),
    );
    await updatedPrediction.save();

    league.capital = updatedLeague.capital;
    return updatedPrediction;
  } catch (error) {
    // Reverse the capital update only if it was successfully applied.
    if (capitalWasUpdated) {
      await ManualLeague.updateOne(
        { _id: league._id, mode: "SEMI_AUTO" },
        { $inc: { capital: -profit } },
      );
    }

    // Make the prediction eligible for a later retry.
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
 * Settle all older pending SEMI_AUTO predictions when the next slot arrives.
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

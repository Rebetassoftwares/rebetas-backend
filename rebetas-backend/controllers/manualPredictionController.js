const ManualPrediction = require("../models/ManualPrediction");
const ManualLeague = require("../models/ManualLeague");
const SystemState = require("../models/SystemState");
const { calculateCycles } = require("../utils/cycleCalculator");
const { calculateBaseStake } = require("../services/martingaleService");
const {
  recomputeMartingale,
} = require("../services/martingaleRecomputeService");

exports.createManualPrediction = async (req, res) => {
  try {
    const { leagueId, homeTeam, awayTeam, odd } = req.body;

    if (!leagueId) {
      return res.status(400).json({ message: "leagueId is required" });
    }

    if (!homeTeam || !String(homeTeam).trim()) {
      return res.status(400).json({ message: "homeTeam is required" });
    }

    if (!awayTeam || !String(awayTeam).trim()) {
      return res.status(400).json({ message: "awayTeam is required" });
    }

    if (String(homeTeam).trim() === String(awayTeam).trim()) {
      return res
        .status(400)
        .json({ message: "homeTeam and awayTeam cannot be the same" });
    }

    if (!Number.isFinite(Number(odd)) || Number(odd) <= 0) {
      return res
        .status(400)
        .json({ message: "odd must be a valid number greater than 0" });
    }

    const league = await ManualLeague.findById(leagueId);

    if (!league) {
      return res.status(404).json({ message: "League not found" });
    }

    if (league.mode !== "MANUAL") {
      return res.status(400).json({
        message: "This league is not in MANUAL mode",
      });
    }

    const lastPrediction = await ManualPrediction.findOne({
      leagueId,
      type: "MANUAL",
    }).sort({ scheduledFor: -1 });

    let scheduledFor;
    if (!lastPrediction) {
      scheduledFor = new Date(league.firstPredictionTime);
    } else {
      scheduledFor = new Date(
        new Date(lastPrediction.scheduledFor).getTime() +
          Number(league.intervalMinutes) * 60 * 1000,
      );
    }

    const systemState = await SystemState.findOne({ key: "main" });

    if (!systemState) {
      return res.status(500).json({ message: "System state not initialized" });
    }

    // ✅ base stake only at creation
    const stake = calculateBaseStake(
      Number(systemState.initialCapital || systemState.capital || 0),
      systemState.baseStakePercent,
    );

    const matchNumber =
      Math.floor(Math.random() * Number(league.totalMatches)) + 1;

    const cycles = calculateCycles(league, scheduledFor);

    const prediction = await ManualPrediction.create({
      leagueId,
      platform: league.platform,
      leagueName: league.leagueName,
      type: "MANUAL",
      matchNumber,
      homeTeam: String(homeTeam).trim(),
      awayTeam: String(awayTeam).trim(),
      odd: Number(odd),
      stake,
      scheduledFor,
      cycles,
      status: "pending",
    });

    res.status(201).json(prediction);
  } catch (err) {
    console.error("Create manual prediction error:", err);
    res.status(500).json({ message: "Failed to create prediction" });
  }
};

exports.getPredictionsByLeague = async (req, res) => {
  try {
    const { leagueId } = req.params;

    const predictions = await ManualPrediction.find({ leagueId }).sort({
      scheduledFor: 1,
      createdAt: 1,
    });

    res.json(predictions);
  } catch (err) {
    console.error("Fetch predictions error:", err);
    res.status(500).json({ message: "Failed to fetch predictions" });
  }
};

exports.updatePredictionResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["won", "loss"].includes(status)) {
      return res.status(400).json({ message: "status must be won or loss" });
    }

    const prediction = await ManualPrediction.findById(id);

    if (!prediction) {
      return res.status(404).json({ message: "Prediction not found" });
    }

    if (prediction.status !== "pending") {
      return res.status(400).json({
        message: "Prediction result has already been updated",
      });
    }

    const win = status === "won";
    const stake = Number(prediction.stake || 0);
    const odd = Number(prediction.odd || 0);

    const resultAmount = win ? Math.round(stake * odd) : 0;
    const profit = resultAmount - stake;

    prediction.status = status;
    prediction.resultAmount = resultAmount;
    prediction.profit = profit;
    prediction.resultStatus = win ? "WIN" : "LOSS";

    await prediction.save();

    await recomputeMartingale(prediction.platform, prediction.leagueName);

    const systemState = await SystemState.findOne({ key: "main" });

    res.json({
      message: "Prediction result updated successfully",
      prediction,
      capitalAfter: systemState?.capital || 0,
      resultAmount,
      profit,
    });
  } catch (err) {
    console.error("Update prediction result error:", err);
    res.status(500).json({ message: "Failed to update prediction result" });
  }
};

exports.getLiveManualPredictions = async (req, res) => {
  try {
    const now = new Date();

    const activeLeagues = await ManualLeague.find({ isActive: true }).select(
      "_id platform leagueName mode",
    );

    const activeLeagueIds = activeLeagues.map((league) => league._id);

    const predictions = await ManualPrediction.find({
      leagueId: { $in: activeLeagueIds },
      scheduledFor: { $lte: now },
      type: { $in: ["MANUAL", "SEMI_AUTO"] },
    }).sort({ scheduledFor: -1, createdAt: -1 });

    res.json(predictions);
  } catch (err) {
    console.error("Fetch live manual predictions error:", err);
    res.status(500).json({ message: "Failed to fetch live predictions" });
  }
};

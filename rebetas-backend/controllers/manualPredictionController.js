const ManualPrediction = require("../models/ManualPrediction");
const ManualLeague = require("../models/ManualLeague");
const SystemState = require("../models/SystemState");
const { calculateCycles } = require("../utils/cycleCalculator");
const { storePrediction } = require("./historyController");
const {
  getStake,
  updateStake,
  getTrackerKey,
} = require("../services/martingaleService");

function getISOWeek(dateInput) {
  const date = new Date(dateInput);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const utcDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );

  const dayNum = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);

  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((utcDate - yearStart) / 86400000 + 1) / 7);

  return String(weekNo);
}

function formatHistoryDate(dateInput) {
  const date = new Date(dateInput);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().split("T")[0];
}

function formatHistoryMonth(dateInput) {
  const date = new Date(dateInput);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString("default", { month: "long" });
}

function buildHistoryMatch(prediction) {
  if (prediction.homeTeam && prediction.awayTeam) {
    return `${prediction.homeTeam} vs ${prediction.awayTeam}`;
  }

  if (prediction.team) {
    return prediction.team;
  }

  return "Unknown Match";
}

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

    const trackerKey = getTrackerKey(league.platform, league.leagueName);
    const stake = getStake(trackerKey, systemState);

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

    prediction.status = status;
    await prediction.save();

    const systemState = await SystemState.findOne({ key: "main" });
    if (!systemState) {
      return res.status(500).json({ message: "System state not initialized" });
    }

    const win = status === "won";
    const stake = Number(prediction.stake || 0);
    const odd = Number(prediction.odd || 0);

    const resultAmount = win ? Math.round(stake * odd) : 0;
    const profit = resultAmount - stake;

    systemState.capital += profit;
    await systemState.save();

    const trackerKey = getTrackerKey(
      prediction.platform,
      prediction.leagueName,
    );
    updateStake(trackerKey, win, systemState);

    const historyDateSource = prediction.scheduledFor || new Date();

    await storePrediction({
      platform: prediction.platform,
      league: prediction.leagueName,
      season: null,
      week: getISOWeek(historyDateSource),
      matchId: String(prediction._id),
      match: buildHistoryMatch(prediction),
      prediction:
        prediction.type === "SEMI_AUTO" ? prediction.team : "OVER 1.5",
      odd,
      stake,
      resultAmount,
      profit,
      capitalAfter: systemState.capital,
      resultStatus: win ? "WIN" : "LOSS",
      homeScore: null,
      awayScore: null,
      date: formatHistoryDate(historyDateSource),
      month: formatHistoryMonth(historyDateSource),
    });

    res.json({
      message: "Prediction result updated successfully",
      prediction,
      capitalAfter: systemState.capital,
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

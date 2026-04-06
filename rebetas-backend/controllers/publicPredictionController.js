const ManualLeague = require("../models/ManualLeague");
const ManualPrediction = require("../models/ManualPrediction");

exports.getLivePrediction = async (req, res) => {
  try {
    const { leagueId } = req.params;
    const league = await ManualLeague.findById(leagueId);

    if (!league) {
      return res.status(404).json({ message: "League not found" });
    }

    if (!league.isActive) {
      return res.json(null);
    }

    if (league.mode === "AUTO") {
      return res.json({
        type: "AUTO",
        message: "Use AUTO engine endpoint",
      });
    }

    const now = new Date();

    const prediction = await ManualPrediction.findOne({
      leagueId,
      scheduledFor: { $lte: now },
    }).sort({ scheduledFor: -1, createdAt: -1 });

    if (!prediction) {
      return res.json(null);
    }

    res.json({
      ...prediction.toObject(),
      type: prediction.type,
      intervalMinutes: Number(league.intervalMinutes || 0),
      intervalSeconds: Number(league.intervalSeconds || 0),
      firstPredictionTime: league.firstPredictionTime,
      isActive: league.isActive,
    });
  } catch (err) {
    console.error("Public live prediction error:", err);
    res.status(500).json({ message: "Failed to fetch live prediction" });
  }
};

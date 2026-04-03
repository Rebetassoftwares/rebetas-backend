const ManualLeague = require("../models/ManualLeague");
const ManualPrediction = require("../models/ManualPrediction");

exports.getLivePrediction = async (req, res) => {
  try {
    const { leagueId } = req.params;
    const league = await ManualLeague.findById(leagueId);

    if (!league) {
      return res.status(404).json({ message: "League not found" });
    }

    // ✅ ADD THIS LINE
    if (!league.isActive) {
      return res.json(null);
    }

    // 🔵 AUTO MODE
    if (league.mode === "AUTO") {
      // call your existing prediction engine logic here
      return res.json({
        type: "AUTO",
        message: "Use AUTO engine endpoint",
      });
    }

    // 🟢 MANUAL + 🟣 SEMI_AUTO
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
      intervalMinutes: Number(league.intervalMinutes || 0), // 🔥 ADD THIS
    });
  } catch (err) {
    console.error("Public live prediction error:", err);
    res.status(500).json({ message: "Failed to fetch live prediction" });
  }
};

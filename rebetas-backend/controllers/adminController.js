const SystemState = require("../models/SystemState");
const ManualLeague = require("../models/ManualLeague");

/* ------------------------------
   GET SYSTEM SETTINGS
------------------------------*/
async function getSettings(req, res) {
  try {
    const state = await SystemState.findOne({ key: "main" });

    if (!state) {
      return res.status(404).json({
        message: "System state not initialized",
      });
    }

    res.json(state);
  } catch (error) {
    console.error("Admin settings fetch error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

/* ------------------------------
   UPDATE SYSTEM SETTINGS
------------------------------*/
async function updateSettings(req, res) {
  try {
    const { capital, baseStakePercent, multiplier, bettingSimulationActive } =
      req.body;

    const updates = {};

    // ✅ GLOBAL CAPITAL STILL VALID (seed capital / reset reference)
    if (capital !== undefined) {
      if (typeof capital !== "number" || capital < 0) {
        return res.status(400).json({
          message: "Capital must be a valid non-negative number",
        });
      }
      updates.capital = capital;
    }

    if (baseStakePercent !== undefined) {
      if (typeof baseStakePercent !== "number" || baseStakePercent < 0) {
        return res.status(400).json({
          message: "Base stake percent must be a valid non-negative number",
        });
      }
      updates.baseStakePercent = baseStakePercent;
    }

    if (multiplier !== undefined) {
      if (typeof multiplier !== "number" || multiplier < 1) {
        return res.status(400).json({
          message: "Multiplier must be >= 1",
        });
      }
      updates.multiplier = multiplier;
    }

    if (bettingSimulationActive !== undefined) {
      if (typeof bettingSimulationActive !== "boolean") {
        return res.status(400).json({
          message: "bettingSimulationActive must be boolean",
        });
      }
      updates.bettingSimulationActive = bettingSimulationActive;
    }

    const updated = await SystemState.findOneAndUpdate(
      { key: "main" },
      updates,
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({
        message: "System state not found",
      });
    }

    res.json(updated);
  } catch (error) {
    console.error("Admin update error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

/* ------------------------------
   RESET GLOBAL CAPITAL ONLY
   (does NOT touch leagues)
------------------------------*/
async function resetCapital(req, res) {
  try {
    const { capital } = req.body;

    if (typeof capital !== "number" || capital < 0) {
      return res.status(400).json({
        message: "Capital must be a valid non-negative number",
      });
    }

    const updated = await SystemState.findOneAndUpdate(
      { key: "main" },
      { capital },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({
        message: "System state not found",
      });
    }

    res.json(updated);
  } catch (error) {
    console.error("Capital reset error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

/* ------------------------------
   GET ALL LEAGUE CAPITALS
------------------------------*/
async function getAllLeagueCapitals(req, res) {
  try {
    const leagues = await ManualLeague.find({})
      .select("platform leagueName capital isActive")
      .sort({ platform: 1, leagueName: 1 });

    res.json(
      leagues.map((l) => ({
        id: l._id,
        platform: l.platform,
        leagueName: l.leagueName,
        capital: l.capital || 0,
        isActive: l.isActive,
      })),
    );
  } catch (error) {
    console.error("Fetch league capitals error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

/* ------------------------------
   RESET ALL LEAGUE CAPITALS
------------------------------*/
async function resetAllLeagueCapitals(req, res) {
  try {
    const { capital } = req.body;

    if (typeof capital !== "number" || capital < 0) {
      return res.status(400).json({
        message: "Capital must be a valid non-negative number",
      });
    }

    await ManualLeague.updateMany({}, { capital });

    res.json({
      message: "All league capitals reset successfully",
      capital,
    });
  } catch (error) {
    console.error("Reset all league capitals error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getSettings,
  updateSettings,
  resetCapital,

  // NEW
  getAllLeagueCapitals,
  resetAllLeagueCapitals,
};

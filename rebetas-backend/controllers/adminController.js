const SystemState = require("../models/SystemState");

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

async function updateSettings(req, res) {
  try {
    const { capital, baseStakePercent, multiplier, bettingSimulationActive } =
      req.body;

    const updates = {};

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
          message: "Multiplier must be a number greater than or equal to 1",
        });
      }
      updates.multiplier = multiplier;
    }

    if (bettingSimulationActive !== undefined) {
      if (typeof bettingSimulationActive !== "boolean") {
        return res.status(400).json({
          message: "bettingSimulationActive must be true or false",
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

module.exports = {
  getSettings,
  updateSettings,
  resetCapital,
};

const SystemSettings = require("../models/SystemSettings");

/* =========================
   GET PUBLIC SETTINGS (USER)
========================= */
exports.getSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne().lean();

    if (!settings) {
      return res.json({
        minWithdrawal: {},
      });
    }

    res.json({
      minWithdrawal: settings.minWithdrawal || {},
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch settings" });
  }
};

/* =========================
   UPDATE SETTINGS (ADMIN)
========================= */
exports.updateSettings = async (req, res) => {
  try {
    const { minWithdrawal } = req.body;

    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = new SystemSettings();
    }

    if (minWithdrawal) {
      settings.minWithdrawal = minWithdrawal;
    }

    await settings.save();

    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update settings" });
  }
};

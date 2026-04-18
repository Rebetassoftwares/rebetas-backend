const express = require("express");
const router = express.Router();

const {
  getSettings,
  updateSettings,
  resetCapital,
  getAllLeagueCapitals,
  resetAllLeagueCapitals,
} = require("../controllers/adminController");

/* ---------------- SYSTEM SETTINGS ---------------- */
router.get("/settings", getSettings);
router.put("/settings", updateSettings);
router.put("/reset-capital", resetCapital);

/* ---------------- LEAGUE CAPITALS ---------------- */

// 🔥 fetch all league capitals
router.get("/league-capitals", getAllLeagueCapitals);

// 🔥 reset all league capitals
router.put("/league-capitals/reset", resetAllLeagueCapitals);

module.exports = router;

const express = require("express");
const router = express.Router();

const {
  getSettings,
  updateSettings,
  resetCapital,
  getAllLeagueCapitals,
  resetAllLeagueCapitals,
} = require("../controllers/adminController");

const {
  getActivitySettings,
  updateActivitySettings,
} = require("../controllers/activityController");

/* ---------------- SYSTEM SETTINGS ---------------- */

router.get("/settings", getSettings);
router.put("/settings", updateSettings);
router.put("/reset-capital", resetCapital);

/* ---------------- ACTIVITY COUNTER SETTINGS ---------------- */

router.get("/activity-settings", getActivitySettings);
router.put("/activity-settings", updateActivitySettings);

/* ---------------- LEAGUE CAPITALS ---------------- */

router.get("/league-capitals", getAllLeagueCapitals);
router.put("/league-capitals/reset", resetAllLeagueCapitals);

module.exports = router;

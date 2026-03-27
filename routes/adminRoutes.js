const express = require("express");

const router = express.Router();

const {
  getSettings,
  updateSettings,
  resetCapital,
} = require("../controllers/adminController");

/*
GET CURRENT SETTINGS
*/
router.get("/settings", getSettings);

/*
UPDATE SETTINGS
*/
router.put("/settings", updateSettings);

/*
RESET CAPITAL
*/
router.put("/reset-capital", resetCapital);

module.exports = router;

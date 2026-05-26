const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authenticateUser");
const requireAdmin = require("../middleware/requireAdmin");

const {
  getAutoPilotAnalytics,
} = require("../controllers/adminInvestmentAnalyticsController");

/*
ADMIN AUTOPILOT ANALYTICS
*/

router.use(authenticateUser, requireAdmin);

router.get("/", getAutoPilotAnalytics);

module.exports = router;

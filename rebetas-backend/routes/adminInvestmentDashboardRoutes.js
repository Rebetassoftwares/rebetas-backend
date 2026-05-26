const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authenticateUser");
const requireAdmin = require("../middleware/requireAdmin");

const {
  getAdminAutoPilotDashboard,
} = require("../controllers/adminInvestmentDashboardController");

/*
ADMIN AUTOPILOT DASHBOARD
*/

router.use(authenticateUser, requireAdmin);

router.get("/", getAdminAutoPilotDashboard);

module.exports = router;

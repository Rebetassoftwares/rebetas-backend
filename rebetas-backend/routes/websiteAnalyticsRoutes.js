const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authenticateUser");
const requireAdmin = require("../middleware/requireAdmin");

const {
  getWebsiteAnalytics,
} = require("../controllers/websiteAnalyticsController");

router.get("/", authenticateUser, requireAdmin, getWebsiteAnalytics);

module.exports = router;

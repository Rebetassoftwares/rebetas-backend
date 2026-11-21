const express = require("express");
const router = express.Router();

const {
  trackWebsiteEvent,
} = require("../controllers/websiteTrackingController");

// Public endpoint: website visitors do not need accounts to be tracked.
router.post("/event", trackWebsiteEvent);

module.exports = router;

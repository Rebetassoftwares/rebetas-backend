const express = require("express");
const router = express.Router();

const { getPrediction } = require("../controllers/predictionController");
const authenticateUser = require("../middleware/authenticateUser");
const requireSubscription = require("../middleware/requireSubscription");

/*
GET prediction for a platform and league

Example:
GET /api/prediction/bet9ja/england
*/

router.get(
  "/:platform/:league",
  authenticateUser,
  requireSubscription,
  getPrediction,
);

module.exports = router;

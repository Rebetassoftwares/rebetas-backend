const express = require("express");
const router = express.Router();

const {
  getLivePrediction,
} = require("../controllers/publicPredictionController");

router.get("/live/:leagueId", getLivePrediction);

module.exports = router;

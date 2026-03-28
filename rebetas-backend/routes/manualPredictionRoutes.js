const express = require("express");
const router = express.Router();

const {
  createManualPrediction,
  getPredictionsByLeague,
  updatePredictionResult,
  getLiveManualPredictions,
} = require("../controllers/manualPredictionController");

router.post("/", createManualPrediction);
router.get("/league/:leagueId", getPredictionsByLeague);

// ✅ LIVE (FOR USERS)
router.get("/live", getLiveManualPredictions);

// ✅ UPDATE RESULT
router.put("/:id/result", updatePredictionResult);

module.exports = router;

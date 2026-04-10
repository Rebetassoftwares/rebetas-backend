const express = require("express");
const router = express.Router();

const {
  createManualPrediction,
  getPredictionsByLeague,
  updatePredictionResult,
  getLiveManualPredictions,
  updatePredictionResultsBatch,
  autoResolvePendingPredictions,
} = require("../controllers/manualPredictionController");

router.post("/", createManualPrediction);
router.get("/league/:leagueId", getPredictionsByLeague);

// ✅ LIVE (FOR USERS)
router.get("/live", getLiveManualPredictions);

// ✅ UPDATE RESULT
router.put("/:id/result", updatePredictionResult);

router.put("/batch-result", updatePredictionResultsBatch);

router.post("/auto-resolve", autoResolvePendingPredictions);

module.exports = router;

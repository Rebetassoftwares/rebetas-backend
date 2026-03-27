const express = require("express");
const router = express.Router();

const {
  getPredictionMode,
  updatePredictionMode,
} = require("../controllers/predictionSettingsController");

// You can later protect with admin middleware

router.get("/", getPredictionMode);
router.put("/", updatePredictionMode);

module.exports = router;

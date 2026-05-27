const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authenticateUser");
const requireAdmin = require("../middleware/requireAdmin");

const {
  getCurrencyRates,
  upsertCurrencyRate,
  updateCurrencyRateStatus,
  deleteCurrencyRate,
} = require("../controllers/adminCurrencyController");

/*
ADMIN CURRENCY MANAGEMENT
*/

router.use(authenticateUser, requireAdmin);

router.get("/", getCurrencyRates);

router.post("/", upsertCurrencyRate);

router.patch("/:id/status", updateCurrencyRateStatus);

router.delete("/:id", deleteCurrencyRate);

module.exports = router;

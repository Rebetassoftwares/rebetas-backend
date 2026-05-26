const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authenticateUser");
const requireAdmin = require("../middleware/requireAdmin");

const {
  creditManualProfit,
} = require("../controllers/adminManualProfitController");

/*
ADMIN MANUAL PROFIT CREDIT
*/

router.use(authenticateUser, requireAdmin);

router.post("/:id/credit", creditManualProfit);

module.exports = router;

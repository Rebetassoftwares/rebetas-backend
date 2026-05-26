const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authenticateUser");
const requireAdmin = require("../middleware/requireAdmin");

const {
  creditDailyProfitController,
} = require("../controllers/adminDailyProfitController");

/*
ADMIN DAILY PROFIT CREDIT
*/

router.use(authenticateUser, requireAdmin);

router.post("/credit", creditDailyProfitController);

module.exports = router;

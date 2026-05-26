const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authenticateUser");

const {
  initializeDeposit,
  verifyDeposit,
} = require("../controllers/investmentPaymentController");

/*
AUTOPILOT PAYMENT ROUTES
*/

router.post("/deposit/init", authenticateUser, initializeDeposit);

router.post("/deposit/verify", authenticateUser, verifyDeposit);

module.exports = router;

const express = require("express");

const router = express.Router();

const {
  initializePayment,
  verifyPayment,
} = require("../controllers/paymentController");

const authenticateUser = require("../middleware/authenticateUser");

router.post("/initialize", authenticateUser, initializePayment);

router.post("/verify", authenticateUser, verifyPayment);

module.exports = router;

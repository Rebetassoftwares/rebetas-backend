const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authenticateUser");

const {
  requestWithdrawal,
  getMyWithdrawals,
} = require("../controllers/promoWithdrawalController");

router.post("/", authenticateUser, requestWithdrawal);
router.get("/my", authenticateUser, getMyWithdrawals);

module.exports = router;

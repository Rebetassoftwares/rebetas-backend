const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authenticateUser");

const {
  getMyPayoutDetail,
  saveMyPayoutDetail,
  getBanks,
  verifyAccount,
} = require("../controllers/payoutDetailController");

router.get("/my", authenticateUser, getMyPayoutDetail);
router.post("/my", authenticateUser, saveMyPayoutDetail);

// 🔥 NEW
router.get("/banks", authenticateUser, getBanks);
router.post("/verify-account", authenticateUser, verifyAccount);

module.exports = router;

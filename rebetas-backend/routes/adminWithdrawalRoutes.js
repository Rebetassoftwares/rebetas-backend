const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authenticateUser");
const requireAdmin = require("../middleware/requireAdmin");

const {
  getAllWithdrawals,
  processWithdrawal,
} = require("../controllers/adminWithdrawalController");

router.get("/", authenticateUser, requireAdmin, getAllWithdrawals);
router.put("/:id", authenticateUser, requireAdmin, processWithdrawal);

module.exports = router;

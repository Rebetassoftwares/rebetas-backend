const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authenticateUser");
const requireAdmin = require("../middleware/requireAdmin");

const {
  getAllWithdrawals,
  getWithdrawalById,
  approveWithdrawalController,
  rejectWithdrawalController,
  payWithdrawalController,
  getWithdrawalAuditLogs,
} = require("../controllers/adminInvestmentWithdrawalController");

/*
ADMIN AUTOPILOT WITHDRAWAL ROUTES
*/

router.use(authenticateUser, requireAdmin);

router.get("/", getAllWithdrawals);

router.get("/:id/audit", getWithdrawalAuditLogs);

router.get("/:id", getWithdrawalById);

router.patch("/:id/approve", approveWithdrawalController);

router.patch("/:id/reject", rejectWithdrawalController);

router.patch("/:id/pay", payWithdrawalController);

module.exports = router;

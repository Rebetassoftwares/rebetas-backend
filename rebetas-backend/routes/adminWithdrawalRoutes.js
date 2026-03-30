const express = require("express");

const {
  getAllWithdrawals,
  approveWithdrawalController,
  rejectWithdrawalController,
  payWithdrawalController,
  getWithdrawalAuditLogs,
} = require("../controllers/adminWithdrawalController");

const {
  getWithdrawalAnalytics,
} = require("../controllers/withdrawalAnalyticsController");

// ✅ FIXED: use correct middleware
const authenticateUser = require("../middleware/authenticateUser");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

/* ================================
   AUTH (STRICT)
================================ */
router.use(authenticateUser, requireAdmin);

/* ================================
   GET ALL WITHDRAWALS
================================ */
router.get("/", getAllWithdrawals);

/* ================================
   ANALYTICS
================================ */
router.get("/analytics", getWithdrawalAnalytics);

/* ================================
   AUDIT LOGS
================================ */
router.get("/:id/audit", getWithdrawalAuditLogs);

/* ================================
   ACTIONS
================================ */
router.patch("/:id/approve", approveWithdrawalController);
router.patch("/:id/reject", rejectWithdrawalController);
router.patch("/:id/pay", payWithdrawalController);

module.exports = router;

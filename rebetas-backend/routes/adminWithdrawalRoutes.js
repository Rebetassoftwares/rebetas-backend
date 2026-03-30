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
const auth = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

router.use(auth, requireAdmin);

router.get("/", getAllWithdrawals);
router.get("/analytics", getWithdrawalAnalytics);
router.get("/:id/audit", getWithdrawalAuditLogs);

router.patch("/:id/approve", approveWithdrawalController);
router.patch("/:id/reject", rejectWithdrawalController);
router.patch("/:id/pay", payWithdrawalController);

module.exports = router;

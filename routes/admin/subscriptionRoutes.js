const express = require("express");

const router = express.Router();

const authenticateUser = require("../../middleware/authenticateUser");
const requireAdmin = require("../../middleware/requireAdmin");

const {
  getSubscriptions,
  getUserSubscriptions,
  cancelSubscription,
} = require("../../controllers/admin/subscriptionController");

router.get("/", authenticateUser, requireAdmin, getSubscriptions);

router.get(
  "/user/:userId",
  authenticateUser,
  requireAdmin,
  getUserSubscriptions,
);

router.patch("/:id/cancel", authenticateUser, requireAdmin, cancelSubscription);

module.exports = router;

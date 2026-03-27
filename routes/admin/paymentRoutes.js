const express = require("express");

const router = express.Router();

const authenticateUser = require("../../middleware/authenticateUser");
const requireAdmin = require("../../middleware/requireAdmin");

const {
  getPayments,
  getPaymentById,
  getUserPayments,
} = require("../../controllers/admin/paymentController");

router.get("/", authenticateUser, requireAdmin, getPayments);

router.get("/:id", authenticateUser, requireAdmin, getPaymentById);

router.get("/user/:userId", authenticateUser, requireAdmin, getUserPayments);

module.exports = router;

const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authenticateUser");
const requireAdmin = require("../middleware/requireAdmin");

const {
  getTransactions,
  getTransactionById,
} = require("../controllers/adminInvestmentTransactionController");

/*
ADMIN AUTOPILOT TRANSACTION ROUTES
*/

router.use(authenticateUser, requireAdmin);

router.get("/", getTransactions);

router.get("/:id", getTransactionById);

module.exports = router;

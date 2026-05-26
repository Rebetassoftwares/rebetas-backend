const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authenticateUser");
const requireAdmin = require("../middleware/requireAdmin");

const {
  getAllAccounts,
  getAccountById,
  suspendAccount,
  reactivateAccount,
  closeAccount,
} = require("../controllers/adminInvestmentAccountController");

/*
ADMIN AUTOPILOT ACCOUNT MANAGEMENT
*/

router.use(authenticateUser, requireAdmin);

router.get("/", getAllAccounts);

router.get("/:id", getAccountById);

router.patch("/:id/suspend", suspendAccount);

router.patch("/:id/reactivate", reactivateAccount);

router.patch("/:id/close", closeAccount);

module.exports = router;

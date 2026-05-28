const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authenticateUser");
const investmentController = require("../controllers/investmentController");

/*
USER AUTOPILOT ROUTES
*/

router.get("/packages", authenticateUser, investmentController.getPackages);

router.get("/my", authenticateUser, investmentController.getMyInvestment);

router.get("/dashboard", authenticateUser, investmentController.getDashboard);

router.post("/compound", authenticateUser, investmentController.compoundProfit);

router.post(
  "/compound-referral",
  authenticateUser,
  investmentController.compoundReferral,
);

router.post(
  "/withdraw-profit",
  authenticateUser,
  investmentController.withdrawProfit,
);

router.post(
  "/withdraw-referral",
  authenticateUser,
  investmentController.withdrawReferral,
);

router.post(
  "/withdraw-capital",
  authenticateUser,
  investmentController.withdrawCapital,
);

router.get(
  "/referrals",
  authenticateUser,
  investmentController.getReferralList,
);

router.get("/history", authenticateUser, investmentController.getHistory);

module.exports = router;

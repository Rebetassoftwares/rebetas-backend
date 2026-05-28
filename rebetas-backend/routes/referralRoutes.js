const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authenticateUser");

const {
  getReferralDashboard,
  getReferralBonuses,
  getReferredUsers,
} = require("../controllers/referralController");

/*
USER REFERRAL ROUTES
*/

router.use(authenticateUser);

router.get("/dashboard", getReferralDashboard);
router.get("/bonuses", getReferralBonuses);
router.get("/referred-users", getReferredUsers);

module.exports = router;

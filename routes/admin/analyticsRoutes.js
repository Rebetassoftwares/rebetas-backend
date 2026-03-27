const express = require("express");

const router = express.Router();

const authenticateUser = require("../../middleware/authenticateUser");
const requireAdmin = require("../../middleware/requireAdmin");

const { getDashboard } = require("../../controllers/admin/analyticsController");

router.get(
  "/dashboard",
  (req, res, next) => {
    console.log("👉 DASHBOARD ROUTE HIT");
    next();
  },
  authenticateUser,
  requireAdmin,
  getDashboard,
);
module.exports = router;

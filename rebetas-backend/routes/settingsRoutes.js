const express = require("express");
const router = express.Router();

const {
  getSettings,
  updateSettings,
} = require("../controllers/settingsController");

const authenticateUser = require("../middleware/authenticateUser");
const requireAdmin = require("../middleware/requireAdmin");

/* =========================
   PUBLIC (USER)
========================= */
router.get("/", getSettings);

/* =========================
   ADMIN
========================= */
router.put("/", authenticateUser, requireAdmin, updateSettings);

module.exports = router;

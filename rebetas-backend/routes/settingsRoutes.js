const express = require("express");
const router = express.Router();
const {
  getSettings,
  updateSettings,
} = require("../controllers/settingsController");

const { protect, isAdmin } = require("../middleware/authMiddleware");

/* =========================
   PUBLIC (USER)
========================= */
router.get("/", getSettings);

/* =========================
   ADMIN
========================= */
router.put("/", protect, isAdmin, updateSettings);

module.exports = router;

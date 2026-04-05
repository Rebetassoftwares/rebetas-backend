const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authenticateUser");

const {
  getMyPromo,
  previewPromoCode, // ✅ NEW
} = require("../controllers/promoController");

/* ---------------- USER PROMO ---------------- */

// Get user's promo stats (owner side)
router.get("/my", authenticateUser, getMyPromo);

/* ---------------- PROMO PREVIEW ---------------- */

// 🔥 PUBLIC PREVIEW (no auth required)
router.post("/preview", previewPromoCode);

module.exports = router;

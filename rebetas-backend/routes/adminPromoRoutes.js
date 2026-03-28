const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authenticateUser");
const requireAdmin = require("../middleware/requireAdmin");

const {
  createPromoCode,
  getPromoCodes,
  updatePromoCode,
  deletePromoCode,
} = require("../controllers/adminPromoController");

const {
  getPromoDetails,
} = require("../controllers/admin/promoDetailsController");

router.post("/", authenticateUser, requireAdmin, createPromoCode);
router.get("/", authenticateUser, requireAdmin, getPromoCodes);
// ✅ FIXED
router.get("/:id", authenticateUser, requireAdmin, getPromoDetails);
router.put("/:id", authenticateUser, requireAdmin, updatePromoCode);
router.delete("/:id", authenticateUser, requireAdmin, deletePromoCode);

module.exports = router;

const express = require("express");
const router = express.Router();

const {
  createPlatform,
  getPlatforms,
  getPlatformById, // 🔥 add this
  updatePlatform,
  deletePlatform,
  getLeaguesByPlatform,
} = require("../controllers/platformController");

const upload = require("../middleware/upload");

/* ---------------- CREATE ---------------- */

router.post("/", upload.single("logo"), createPlatform);

/* ---------------- READ ---------------- */
router.get("/", getPlatforms);

// 🔥 get single platform (important)
router.get("/:id", getPlatformById);

// 🔥 get leagues under platform
router.get("/:platformId/leagues", getLeaguesByPlatform);

/* ---------------- UPDATE ---------------- */

router.put("/:id", upload.single("logo"), updatePlatform);

/* ---------------- DELETE ---------------- */
router.delete("/:id", deletePlatform);

module.exports = router;

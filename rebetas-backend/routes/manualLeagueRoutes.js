const express = require("express");
const router = express.Router();

const {
  createLeague,
  getLeagues,
  getLeagueById,
  updateLeague,
} = require("../controllers/manualLeagueController");

// Later you can protect with admin middleware

const upload = require("../middleware/upload");

router.get("/", getLeagues);
router.get("/:id", getLeagueById);

router.post("/", upload.single("logo"), createLeague);
router.put("/:id", upload.single("logo"), updateLeague);

module.exports = router;

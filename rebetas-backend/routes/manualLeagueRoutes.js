const express = require("express");
const router = express.Router();

const {
  createLeague,
  getLeagues,
  getLeagueById,
  updateLeague,
} = require("../controllers/manualLeagueController");

const upload = require("../middleware/upload");

function handleLogoUpload(req, res, next) {
  upload.single("logo")(req, res, function (err) {
    if (err) {
      console.error("Logo upload middleware error:", err);

      return res.status(400).json({
        message: "Logo upload failed",
        error: err.message,
      });
    }

    next();
  });
}

router.get("/", getLeagues);
router.get("/:id", getLeagueById);

router.post("/", handleLogoUpload, createLeague);
router.put("/:id", handleLogoUpload, updateLeague);

module.exports = router;

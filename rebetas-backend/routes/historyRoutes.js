const express = require("express");
const router = express.Router();

const { getHistory } = require("../controllers/historyController");

/*
GET history for a specific platform + league
IMPORTANT:
- Must match martingale key (platform + leagueName)
- Example:
  /api/history/sportybet/english
*/

router.get("/:platform/:league", getHistory);

module.exports = router;

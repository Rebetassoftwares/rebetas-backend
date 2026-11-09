const express = require("express");
const router = express.Router();

const { getPublicActivity } = require("../controllers/activityController");

router.get("/", getPublicActivity);

module.exports = router;

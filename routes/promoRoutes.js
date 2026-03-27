const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authenticateUser");

const { getMyPromo } = require("../controllers/promoController");

router.get("/my", authenticateUser, getMyPromo);

module.exports = router;

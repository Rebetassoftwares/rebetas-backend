const express = require("express");
const router = express.Router();

const { getPublicPricing } = require("../controllers/pricingController");

router.get("/", getPublicPricing);

module.exports = router;

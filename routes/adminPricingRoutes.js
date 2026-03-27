const express = require("express");

const router = express.Router();

const {
  createCountryPricing,
  getAllPricing,
  updatePricing,
  deletePricing,
} = require("../controllers/adminPricingController");

router.post("/", createCountryPricing);

router.get("/", getAllPricing);

router.put("/:id", updatePricing);

router.delete("/:id", deletePricing);

module.exports = router;

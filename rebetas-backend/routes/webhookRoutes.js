const express = require("express");
const {
  handleFlutterwaveWebhook,
} = require("../controllers/flutterwaveWebhookController");

const router = express.Router();

router.post("/flutterwave", handleFlutterwaveWebhook);

module.exports = router;

const express = require("express");

const {
  handleFlutterwaveUnifiedWebhook,
} = require("../controllers/flutterwaveUnifiedWebhookController");

const router = express.Router();

router.post("/", handleFlutterwaveUnifiedWebhook);

module.exports = router;

const express = require("express");
const router = express.Router();

const {
  handleAutoPilotFlutterwaveWebhook,
} = require("../controllers/autoPilotFlutterwaveWebhookController");

/*
NO AUTH
FLUTTERWAVE CALLS THIS DIRECTLY
*/

router.post("/flutterwave", handleAutoPilotFlutterwaveWebhook);

module.exports = router;

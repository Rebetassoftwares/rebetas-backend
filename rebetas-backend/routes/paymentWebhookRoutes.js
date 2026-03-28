const express = require("express");

const router = express.Router();

const { handleWebhook } = require("../controllers/paymentWebhookController");

/*
NO AUTH — PROVIDERS CALL THIS
*/

router.post("/", handleWebhook);

module.exports = router;

const express = require("express");

const router = express.Router();

const {
  createSubscription,
  checkSubscription,
} = require("../controllers/subscriptionController");

const authenticateUser = require("../middleware/authenticateUser");

router.post("/", authenticateUser, createSubscription);

router.get("/status", authenticateUser, checkSubscription);

module.exports = router;

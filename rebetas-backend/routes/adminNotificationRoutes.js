const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authenticateUser");
const requireAdmin = require("../middleware/requireAdmin");

const {
  getAllNotifications,
  sendUserNotification,
  deleteNotification,
} = require("../controllers/adminNotificationController");

/*
ADMIN NOTIFICATION ROUTES
*/

router.use(authenticateUser, requireAdmin);

router.get("/", getAllNotifications);

router.post("/send-user", sendUserNotification);

router.delete("/:id", deleteNotification);

module.exports = router;

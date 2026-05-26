const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authenticateUser");

const {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
} = require("../controllers/userNotificationController");

/*
USER NOTIFICATION ROUTES
*/

router.use(authenticateUser);

router.get("/", getMyNotifications);

router.get("/unread-count", getUnreadNotificationCount);

router.patch("/:id/read", markNotificationAsRead);

router.patch("/read-all", markAllNotificationsAsRead);

module.exports = router;

const Notification = require("../models/Notification");

async function createNotification({
  userId,
  title,
  message,
  type = "system",
  channel = "in_app",
  metadata = {},
}) {
  if (!userId) {
    throw new Error("Notification userId is required");
  }

  if (!title || !message) {
    throw new Error("Notification title and message are required");
  }

  const notification = await Notification.create({
    userId,
    title,
    message,
    type,
    channel,
    metadata,
  });

  return notification;
}

async function createManyNotifications(notifications = []) {
  const validNotifications = notifications.filter(
    (item) => item.userId && item.title && item.message,
  );

  if (!validNotifications.length) {
    return [];
  }

  return Notification.insertMany(validNotifications);
}

module.exports = {
  createNotification,
  createManyNotifications,
};

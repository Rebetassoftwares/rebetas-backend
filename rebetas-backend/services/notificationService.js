const Notification = require("../models/Notification");
const { sendEmail } = require("./emailService");
const { getNotificationTemplate } = require("../utils/notificationTemplates");

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

  return Notification.create({
    userId,
    title,
    message,
    type,
    channel,
    metadata,
  });
}

async function sendAutoPilotNotification({
  event,
  user,
  data = {},
  metadata = {},
}) {
  if (!user?._id) {
    throw new Error("Notification user is required");
  }

  const template = getNotificationTemplate(event, { user, data });

  const notification = await createNotification({
    userId: user._id,
    title: template.title,
    message: template.message,
    type: template.type,
    channel: "in_app",
    metadata: {
      event,
      ...metadata,
      ...data,
    },
  });

  if (
    template.email &&
    user.email &&
    template.emailSubject &&
    template.emailHtml
  ) {
    await sendEmail({
      to: user.email,
      subject: template.emailSubject,
      html: template.emailHtml,
    });
  }

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
  sendAutoPilotNotification,
};

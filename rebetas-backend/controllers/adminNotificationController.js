const Notification = require("../models/Notification");
const User = require("../models/User");
const { createNotification } = require("../services/notificationService");

async function getAllNotifications(req, res) {
  try {
    const { userId, type, channel, isRead, page = 1, limit = 50 } = req.query;

    const currentPage = Math.max(Number(page) || 1, 1);
    const pageLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const skip = (currentPage - 1) * pageLimit;

    const filter = {};

    if (userId) filter.userId = userId;
    if (type) filter.type = type;
    if (channel) filter.channel = channel;

    if (isRead === "true") filter.isRead = true;
    if (isRead === "false") filter.isRead = false;

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .populate("userId", "fullName username email phone country")
        .lean(),

      Notification.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          page: currentPage,
          limit: pageLimit,
          pages: Math.ceil(total / pageLimit),
        },
      },
    });
  } catch (error) {
    console.error("Admin get notifications error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
}

async function sendUserNotification(req, res) {
  try {
    const {
      userId,
      title,
      message,
      type = "system",
      channel = "in_app",
    } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "userId, title, and message are required",
      });
    }

    const user = await User.findById(userId).select("_id").lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const notification = await createNotification({
      userId,
      title,
      message,
      type,
      channel,
      metadata: {
        createdByAdminId: req.user?._id || req.user?.id || null,
        manual: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Notification sent successfully",
      data: notification,
    });
  } catch (error) {
    console.error("Send notification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to send notification",
    });
  }
}

async function deleteNotification(req, res) {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
}

module.exports = {
  getAllNotifications,
  sendUserNotification,
  deleteNotification,
};

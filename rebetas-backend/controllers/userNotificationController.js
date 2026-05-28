const Notification = require("../models/Notification");

const getUserId = (req) => req.user?._id || req.user?.id;

async function getMyNotifications(req, res) {
  try {
    const { page = 1, limit = 30, unreadOnly } = req.query;

    const currentPage = Math.max(Number(page) || 1, 1);
    const pageLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);
    const skip = (currentPage - 1) * pageLimit;

    const filter = {
      userId: getUserId(req),
      channel: "in_app",
    };

    if (unreadOnly === "true") {
      filter.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),

      Notification.countDocuments(filter),

      Notification.countDocuments({
        userId: getUserId(req),
        channel: "in_app",
        isRead: false,
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          total,
          page: currentPage,
          limit: pageLimit,
          pages: Math.ceil(total / pageLimit),
        },
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
}

async function markNotificationAsRead(req, res) {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: getUserId(req),
        channel: "in_app",
      },
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    console.error("Mark notification read error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update notification",
    });
  }
}

async function markAllNotificationsAsRead(req, res) {
  try {
    await Notification.updateMany(
      {
        userId: getUserId(req),
        channel: "in_app",
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update notifications",
    });
  }
}

async function getUnreadNotificationCount(req, res) {
  try {
    const unreadCount = await Notification.countDocuments({
      userId: getUserId(req),
      channel: "in_app",
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    console.error("Unread notification count error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch unread notification count",
    });
  }
}

module.exports = {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
};

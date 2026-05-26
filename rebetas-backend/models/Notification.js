const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "profit_credit",
        "profit_reinvest",
        "profit_withdrawal",
        "capital_withdrawal",
        "package_activation",
        "package_upgrade",
        "payout_successful",
        "payout_failed",
        "account_suspended",
        "account_reactivated",
        "capital_available",
        "system",
      ],
      required: true,
      index: true,
    },

    channel: {
      type: String,
      enum: ["in_app", "email", "push"],
      default: "in_app",
      index: true,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);

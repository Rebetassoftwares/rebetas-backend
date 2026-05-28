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
        "payment_initialized",
        "payment_successful",
        "package_activation",
        "profit_credit",
        "compound_profit",

        "referral_bonus",
        "referral_compound",
        "referral_withdrawal",

        "profit_withdrawal",
        "capital_withdrawal",
        "withdrawal_approved",
        "withdrawal_rejected",
        "withdrawal_paid",
        "manual_profit_credit",
        "account_suspended",
        "account_reactivated",
        "capital_available",
        "system",
        "maintenance",
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

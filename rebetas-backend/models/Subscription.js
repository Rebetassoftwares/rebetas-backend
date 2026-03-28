const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    plan: {
      type: String,
      enum: ["weekly", "monthly", "yearly"],
      required: true,
    },

    country: {
      type: String,
      required: true,
    },

    currency: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    promoCode: {
      type: String,
      default: null,
    },

    commissionAmount: {
      type: Number,
      default: 0,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

subscriptionSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("Subscription", subscriptionSchema);

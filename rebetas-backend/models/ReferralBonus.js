const mongoose = require("mongoose");

const referralBonusSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    sourceType: {
      type: String,
      enum: ["subscription_payment", "autopilot_profit_credit"],
      required: true,
      index: true,
    },

    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    // Final local amount credited to referrer's referralBalance
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Referrer's local currency
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      default: "USD",
    },

    // USD value for admin tracking
    baseAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    baseCurrency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      default: "USD",
    },

    exchangeRateSnapshot: {
      type: Number,
      default: null,
      min: 0,
    },

    // Original amount that generated the referral bonus
    sourceAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    sourceCurrency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    bonusRate: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["credited", "reversed"],
      default: "credited",
      index: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

referralBonusSchema.index({ referrer: 1, createdAt: -1 });
referralBonusSchema.index({ referredUser: 1, createdAt: -1 });
referralBonusSchema.index({ sourceType: 1, status: 1 });
referralBonusSchema.index({ currency: 1, status: 1 });
referralBonusSchema.index({ baseCurrency: 1 });

module.exports = mongoose.model("ReferralBonus", referralBonusSchema);

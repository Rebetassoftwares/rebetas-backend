const mongoose = require("mongoose");

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    ownerName: {
      type: String,
      required: true,
      trim: true,
    },

    commissionPercent: {
      type: Number,
      required: true,
      min: 0,
    },

    /* ================= NEW ================= */

    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
    },

    freeDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    freeWeeks: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxUsesPerUser: {
      type: Number,
      default: 1,
      min: 1,
    },

    /* ================= EXISTING ================= */

    active: {
      type: Boolean,
      default: true,
    },

    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalEarnedBase: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("PromoCode", promoCodeSchema);

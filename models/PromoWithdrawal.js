const mongoose = require("mongoose");

const promoWithdrawalSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PromoWallet",
      required: true,
    },

    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "paid"],
      default: "pending",
      index: true,
    },

    payoutDetails: {
      type: Object, // flexible (bank, mobile money, etc.)
      default: {},
    },

    adminNote: {
      type: String,
      default: "",
    },

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

promoWithdrawalSchema.index({ ownerId: 1, currency: 1, status: 1 });

module.exports = mongoose.model("PromoWithdrawal", promoWithdrawalSchema);

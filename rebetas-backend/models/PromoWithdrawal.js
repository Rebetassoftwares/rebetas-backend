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
      index: true,
    },

    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    feePolicy: {
      type: String,
      enum: ["platform_pays", "user_pays"],
      default: "user_pays",
    },

    feeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    netAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "processing", "paid", "rejected", "failed"],
      default: "pending",
      index: true,
    },

    payoutDetails: {
      type: Object,
      default: {},
    },

    provider: {
      type: String,
      default: "flutterwave",
      trim: true,
    },

    providerTransferId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    reference: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    transferMeta: {
      type: Object,
      default: {},
    },

    adminNote: {
      type: String,
      default: "",
      trim: true,
    },

    failureReason: {
      type: String,
      default: "",
      trim: true,
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

    paidAt: {
      type: Date,
      default: null,
    },

    failedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

promoWithdrawalSchema.index({ ownerId: 1, currency: 1, status: 1 });
promoWithdrawalSchema.index({ reference: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("PromoWithdrawal", promoWithdrawalSchema);

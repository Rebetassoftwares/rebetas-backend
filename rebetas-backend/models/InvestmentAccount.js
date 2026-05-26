const mongoose = require("mongoose");

const investmentAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InvestmentPackage",
      required: true,
      index: true,
    },

    packageNameSnapshot: {
      type: String,
      required: true,
      trim: true,
    },

    packageAmountSnapshot: {
      type: Number,
      required: true,
      min: 0,
    },

    packageBenefitsSnapshot: {
      type: [String],
      default: [],
    },

    dailyReturnPercentageSnapshot: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      default: "USD",
    },

    userDisplayCurrency: {
      type: String,
      uppercase: true,
      trim: true,
      default: null,
    },

    exchangeRateSnapshot: {
      type: Number,
      default: null,
      min: 0,
    },

    capitalBalance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    profitBalance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    totalProfitEarned: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalProfitWithdrawn: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalCapitalWithdrawn: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["active", "suspended", "closed"],
      default: "active",
      index: true,
    },

    activatedAt: {
      type: Date,
      default: Date.now,
    },

    lastProfitCreditedAt: {
      type: Date,
      default: null,
    },

    lastReinvestDate: {
      type: Date,
      default: null,
    },

    capitalWithdrawAvailableAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

investmentAccountSchema.index({ userId: 1, status: 1 });
investmentAccountSchema.index({ userId: 1, packageId: 1 });

module.exports = mongoose.model("InvestmentAccount", investmentAccountSchema);

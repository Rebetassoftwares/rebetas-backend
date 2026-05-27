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

    // LOCAL amount user paid after conversion
    packageAmountSnapshot: {
      type: Number,
      required: true,
      min: 0,
    },

    // ORIGINAL USD package amount
    basePackageAmountSnapshot: {
      type: Number,
      required: true,
      min: 0,
    },

    basePackageCurrencySnapshot: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      default: "USD",
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

    // LOCAL account currency used for balances, profit, compound, withdrawals
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
investmentAccountSchema.index({ currency: 1, status: 1 });

module.exports = mongoose.model("InvestmentAccount", investmentAccountSchema);

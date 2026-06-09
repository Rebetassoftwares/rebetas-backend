const mongoose = require("mongoose");

const investmentDepositSchema = new mongoose.Schema(
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

    investmentAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InvestmentAccount",
      default: null,
      index: true,
    },

    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InvestmentTransaction",
      default: null,
    },

    // LOCAL amount charged to user
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // LOCAL payment currency
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      default: "USD",
    },

    // ORIGINAL USD package amount
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

    provider: {
      type: String,
      enum: ["flutterwave", "paystack"],
      required: true,
      default: "flutterwave",
    },

    providerReference: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    providerTransactionId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },

    paymentLink: {
      type: String,
      trim: true,
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "successful", "failed", "rejected", "processing"],
      default: "pending",
      index: true,
    },

    rawProviderResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

investmentDepositSchema.index({ userId: 1, createdAt: -1 });
investmentDepositSchema.index({ providerReference: 1 }, { unique: true });
investmentDepositSchema.index({ currency: 1, status: 1 });
investmentDepositSchema.index({ baseCurrency: 1 });

module.exports = mongoose.model("InvestmentDeposit", investmentDepositSchema);

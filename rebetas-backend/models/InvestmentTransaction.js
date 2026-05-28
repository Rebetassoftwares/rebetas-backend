const mongoose = require("mongoose");

const investmentTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    investmentAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InvestmentAccount",
      default: null,
      index: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "package_activation",

        "profit_credit",
        "profit_withdrawal",
        "profit_reinvest",

        "referral_compound",
        "referral_withdrawal",

        "capital_withdrawal",

        "payout_failed",
        "payout_successful",
      ],
      index: true,
    },

    status: {
      type: String,
      required: true,
      enum: ["pending", "successful", "failed", "rejected", "processing"],
      default: "pending",
      index: true,
    },

    // LOCAL user amount
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // LOCAL user currency
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      default: "USD",
    },

    // USD amount for admin tracking
    baseAmount: {
      type: Number,
      default: 0,
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

    balanceBefore: {
      capitalBalance: {
        type: Number,
        default: null,
      },

      profitBalance: {
        type: Number,
        default: null,
      },
    },

    balanceAfter: {
      capitalBalance: {
        type: Number,
        default: null,
      },

      profitBalance: {
        type: Number,
        default: null,
      },
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    reference: {
      type: String,
      trim: true,
      index: true,
      default: null,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

investmentTransactionSchema.index({ userId: 1, createdAt: -1 });
investmentTransactionSchema.index({ type: 1, status: 1 });
investmentTransactionSchema.index({ reference: 1 }, { sparse: true });
investmentTransactionSchema.index({ currency: 1, status: 1 });
investmentTransactionSchema.index({ baseCurrency: 1, type: 1 });

module.exports = mongoose.model(
  "InvestmentTransaction",
  investmentTransactionSchema,
);

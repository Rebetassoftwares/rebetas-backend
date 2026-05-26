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
        "package_upgrade",
        "profit_credit",
        "profit_withdrawal",
        "profit_reinvest",
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

    amount: {
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

    balanceBefore: {
      capitalBalance: { type: Number, default: null },
      profitBalance: { type: Number, default: null },
    },

    balanceAfter: {
      capitalBalance: { type: Number, default: null },
      profitBalance: { type: Number, default: null },
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

module.exports = mongoose.model(
  "InvestmentTransaction",
  investmentTransactionSchema,
);

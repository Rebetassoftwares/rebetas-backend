const mongoose = require("mongoose");

const investmentWithdrawalSchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },

    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InvestmentTransaction",
      default: null,
    },

    withdrawalType: {
      type: String,
      enum: ["profit", "capital"],
      required: true,
      index: true,
    },

    // LOCAL requested amount
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // LOCAL net amount payable
    netAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // LOCAL fee amount
    feeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    feePolicy: {
      type: String,
      enum: ["platform_pays", "user_pays"],
      default: "user_pays",
    },

    // LOCAL user currency
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      default: "USD",
    },

    // USD requested amount for admin tracking
    baseAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // USD net amount for admin tracking
    baseNetAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // USD fee amount for admin tracking
    baseFeeAmount: {
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

    payoutDetailId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PayoutDetail",
      required: true,
    },

    payoutDetails: {
      accountName: {
        type: String,
        trim: true,
        default: "",
      },
      accountNumber: {
        type: String,
        trim: true,
        default: "",
      },
      bankName: {
        type: String,
        trim: true,
        default: "",
      },
      bankCode: {
        type: String,
        trim: true,
        default: "",
      },
    },

    provider: {
      type: String,
      enum: ["flutterwave"],
      default: "flutterwave",
    },

    reference: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },

    providerReference: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },

    providerTransferId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "processing",
        "successful",
        "failed",
        "rejected",
      ],
      default: "pending",
      index: true,
    },

    adminNote: {
      type: String,
      trim: true,
      default: "",
    },

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
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

    failureReason: {
      type: String,
      trim: true,
      default: "",
    },

    transferMeta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    rawProviderResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

investmentWithdrawalSchema.index({ userId: 1, createdAt: -1 });
investmentWithdrawalSchema.index({ investmentAccountId: 1, status: 1 });
investmentWithdrawalSchema.index({ withdrawalType: 1, status: 1 });
investmentWithdrawalSchema.index({ currency: 1, status: 1 });
investmentWithdrawalSchema.index({ baseCurrency: 1, status: 1 });

investmentWithdrawalSchema.index(
  { reference: 1 },
  { unique: true, sparse: true },
);

investmentWithdrawalSchema.index(
  { providerReference: 1 },
  { unique: true, sparse: true },
);

module.exports = mongoose.model(
  "InvestmentWithdrawal",
  investmentWithdrawalSchema,
);

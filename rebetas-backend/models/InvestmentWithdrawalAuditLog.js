const mongoose = require("mongoose");

const investmentWithdrawalAuditLogSchema = new mongoose.Schema(
  {
    withdrawalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InvestmentWithdrawal",
      required: true,
      index: true,
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    actorType: {
      type: String,
      enum: ["user", "admin", "system", "webhook"],
      required: true,
      trim: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    fromStatus: {
      type: String,
      default: "",
      trim: true,
    },

    toStatus: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

investmentWithdrawalAuditLogSchema.index({
  withdrawalId: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "InvestmentWithdrawalAuditLog",
  investmentWithdrawalAuditLogSchema,
);

const mongoose = require("mongoose");

const investmentPackageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
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

    dailyReturnPercentage: {
      type: Number,
      required: true,
      min: 0,
    },

    benefits: {
      type: [String],
      default: [],
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    minimumUpgradeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

investmentPackageSchema.index({ amount: 1, currency: 1 });
investmentPackageSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model("InvestmentPackage", investmentPackageSchema);

const mongoose = require("mongoose");

const currencyRateSchema = new mongoose.Schema(
  {
    baseCurrency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      default: "USD",
    },

    targetCurrency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    rate: {
      type: Number,
      required: true,
      min: 0.000001,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

currencyRateSchema.index(
  { baseCurrency: 1, targetCurrency: 1 },
  { unique: true },
);

module.exports = mongoose.model("CurrencyRate", currencyRateSchema);

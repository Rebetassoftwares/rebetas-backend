const mongoose = require("mongoose");

const countryPricingSchema = new mongoose.Schema(
  {
    country: {
      type: String,
      required: true,
      unique: true,
    },

    currency: {
      type: String,
      required: true,
    },

    weeklyPrice: {
      type: Number,
      required: true,
    },

    monthlyPrice: {
      type: Number,
      required: true,
    },

    yearlyPrice: {
      type: Number,
      required: true,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("CountryPricing", countryPricingSchema);

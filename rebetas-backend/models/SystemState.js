const mongoose = require("mongoose");

const systemStateSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },

    // 🔥 NEW (CRITICAL)
    initialCapital: {
      type: Number,
      default: 500000,
    },

    capital: {
      type: Number,
      default: 500000,
    },

    bettingSimulationActive: {
      type: Boolean,
      default: true,
    },

    baseStakePercent: {
      type: Number,
      default: 0.2,
    },

    multiplier: {
      type: Number,
      default: 7,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("SystemState", systemStateSchema);

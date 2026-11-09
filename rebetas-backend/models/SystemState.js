const mongoose = require("mongoose");

const systemStateSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },

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

    // PROGRAMMED ACTIVITY COUNTERS
    activityMin: {
      type: Number,
      default: 100,
      min: 0,
    },

    activityMax: {
      type: Number,
      default: 250,
      min: 0,
    },

    // Internal generated snapshot; not manually configured.
    activitySnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    activitySnapshotUpdatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("SystemState", systemStateSchema);

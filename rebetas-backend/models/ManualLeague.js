const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    shortName: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

const manualLeagueSchema = new mongoose.Schema(
  {
    platformId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Platform",
    },

    logo: {
      type: String,
    },

    platform: {
      type: String,
      required: true,
      trim: true,
    },

    leagueName: {
      type: String,
      required: true,
      trim: true,
    },

    mode: {
      type: String,
      enum: ["AUTO", "MANUAL", "SEMI_AUTO"],
      default: "MANUAL",
    },

    totalMatches: {
      type: Number,
      required: true,
      min: 1,
    },

    intervalMinutes: {
      type: Number,
      required: true,
      min: 0, // ✅ allow 0 now
      default: 0,
    },

    // 🔥 NEW FIELD
    intervalSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },

    firstPredictionTime: {
      type: Date,
      required: true,
    },

    teams: {
      type: [teamSchema],
      default: [],
    },

    oddRange: {
      min: {
        type: Number,
      },
      max: {
        type: Number,
      },
    },

    cycleConfig: [
      {
        name: {
          type: String,
          required: true,
        },

        start: {
          type: Number,
          required: true,
        },

        // 🔥 NEW FIELD (CRITICAL)
        current: {
          type: Number,
        },

        max: {
          type: Number,
        },
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

manualLeagueSchema.index({ platform: 1, leagueName: 1 }, { unique: true });

module.exports = mongoose.model("ManualLeague", manualLeagueSchema);

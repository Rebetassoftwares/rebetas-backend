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
      enum: [8, 10],
      required: true,
    },

    intervalMinutes: {
      type: Number,
      required: true,
      min: 1,
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
          type: String, // "Season", "Week", "Round"
          required: true,
        },

        start: {
          type: Number,
          required: true,
        },

        max: {
          type: Number, // null = no limit
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

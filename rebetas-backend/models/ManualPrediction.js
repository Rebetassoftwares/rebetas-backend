const mongoose = require("mongoose");

const manualPredictionSchema = new mongoose.Schema(
  {
    leagueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ManualLeague",
      required: true,
      index: true,
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

    type: {
      type: String,
      enum: ["MANUAL", "SEMI_AUTO"],
      required: true,
      default: "MANUAL",
    },

    // manual mode fields
    matchNumber: {
      type: Number,
    },
    homeTeam: {
      type: String,
      trim: true,
    },
    awayTeam: {
      type: String,
      trim: true,
    },

    // semi-auto field
    team: {
      type: String,
      trim: true,
    },

    prediction: {
      type: String,
      default: "O1.5",
    },

    odd: {
      type: Number,
      required: true,
      min: 0,
    },

    stake: {
      type: Number,
      default: 0,
      min: 0,
    },

    scheduledFor: {
      type: Date,
      required: true,
      index: true,
    },

    // 🔥 NEW
    cycles: [
      {
        name: String,
        value: Number,
      },
    ],

    status: {
      type: String,
      enum: ["pending", "won", "loss"],
      default: "pending",
    },
  },
  { timestamps: true },
);

manualPredictionSchema.index({
  leagueId: 1,
  type: 1,
  scheduledFor: 1,
});

module.exports = mongoose.model("ManualPrediction", manualPredictionSchema);

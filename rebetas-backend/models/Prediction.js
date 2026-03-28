const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      required: true,
      index: true,
    },
    league: {
      type: String,
      required: true,
      index: true,
    },
    season: {
      type: String,
      default: null,
    },
    week: {
      type: String,
      default: null,
    },
    matchId: {
      type: String,
      default: null,
    },
    match: {
      type: String,
      required: true,
    },
    prediction: {
      type: String,
      required: true,
      default: "OVER 1.5",
    },
    odd: {
      type: Number,
      default: null,
    },
    stake: {
      type: Number,
      default: 0,
    },
    resultAmount: {
      type: Number,
      default: null,
    },
    profit: {
      type: Number,
      default: null,
    },
    capitalAfter: {
      type: Number,
      default: null,
    },
    resultStatus: {
      type: String,
      enum: ["WIN", "LOSS", "PENDING"],
      default: "PENDING",
    },
    homeScore: {
      type: Number,
      default: null,
    },
    awayScore: {
      type: Number,
      default: null,
    },
    date: {
      type: String,
      default: null,
    },
    month: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

predictionSchema.index({ platform: 1, league: 1, createdAt: -1 });

module.exports = mongoose.model("Prediction", predictionSchema);

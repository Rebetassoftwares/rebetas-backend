const mongoose = require("mongoose");

const predictionSettingsSchema = new mongoose.Schema(
  {
    predictionMode: {
      type: String,
      enum: ["AUTO", "MANUAL"],
      default: "AUTO",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PredictionSettings", predictionSettingsSchema);

const PredictionSettings = require("../models/PredictionSettings");

exports.getPredictionMode = async (req, res) => {
  try {
    let settings = await PredictionSettings.findOne();

    if (!settings) {
      settings = await PredictionSettings.create({
        predictionMode: "AUTO",
      });
    }

    res.json(settings);
  } catch (err) {
    console.error("Get prediction mode error:", err);
    res.status(500).json({ message: "Failed to fetch prediction mode" });
  }
};

exports.updatePredictionMode = async (req, res) => {
  try {
    const { predictionMode } = req.body;

    if (!["AUTO", "MANUAL"].includes(predictionMode)) {
      return res.status(400).json({ message: "Invalid prediction mode" });
    }

    let settings = await PredictionSettings.findOne();

    if (!settings) {
      settings = await PredictionSettings.create({ predictionMode });
    } else {
      settings.predictionMode = predictionMode;
      await settings.save();
    }

    res.json({
      message: "Prediction mode updated successfully",
      settings,
    });
  } catch (err) {
    console.error("Update prediction mode error:", err);
    res.status(500).json({ message: "Failed to update prediction mode" });
  }
};

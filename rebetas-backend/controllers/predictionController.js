const { getLatestPrediction } = require("../services/roundScheduler");

async function getPrediction(req, res) {
  try {
    const { platform, league } = req.params;

    const prediction = getLatestPrediction(platform, league);

    if (!prediction) {
      return res.status(404).json({
        message: "Prediction not ready yet",
      });
    }

    res.json(prediction);
  } catch (error) {
    console.error("Prediction error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
}

module.exports = {
  getPrediction,
};

const Prediction = require("../models/Prediction");

async function cleanupOldPredictions() {
  try {
    const now = new Date();

    // 🔥 14 days ago
    const cutoffDate = new Date(now);
    cutoffDate.setDate(now.getDate() - 14);

    const result = await Prediction.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    console.log(
      `🧹 Cleanup complete: ${result.deletedCount} old predictions removed`,
    );
  } catch (err) {
    console.error("Cleanup error:", err);
  }
}

module.exports = cleanupOldPredictions;

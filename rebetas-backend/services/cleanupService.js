const Prediction = require("../models/Prediction");

async function cleanupOldPredictions() {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 2); // ✅ 2 days

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

const Prediction = require("../models/Prediction");

async function cleanupOldPredictions() {
  try {
    const now = new Date();

    // 👉 Start of TODAY (00:00:00)
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    // 👉 Start of YESTERDAY (00:00:00)
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const result = await Prediction.deleteMany({
      createdAt: { $lt: startOfYesterday },
    });

    console.log(
      `🧹 Cleanup complete: ${result.deletedCount} old predictions removed`,
    );
  } catch (err) {
    console.error("Cleanup error:", err);
  }
}

module.exports = cleanupOldPredictions;

const Prediction = require("../models/Prediction");
const ManualPrediction = require("../models/ManualPrediction");

async function cleanupOldPredictions() {
  try {
    const now = new Date();

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    // 🔥 AUTO PREDICTIONS (based on creation time)
    const autoResult = await Prediction.deleteMany({
      createdAt: { $lt: startOfYesterday },
    });

    // 🔥 MANUAL PREDICTIONS (based on match time)
    const manualResult = await ManualPrediction.deleteMany({
      scheduledFor: { $lt: startOfYesterday },
    });

    console.log("🧹 Cleanup complete:", {
      autoDeleted: autoResult.deletedCount,
      manualDeleted: manualResult.deletedCount,
    });
  } catch (err) {
    console.error("Cleanup error:", err);
  }
}

module.exports = cleanupOldPredictions;

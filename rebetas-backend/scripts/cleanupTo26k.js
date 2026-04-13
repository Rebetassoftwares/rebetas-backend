require("dotenv").config();

const mongoose = require("mongoose");
const ManualPrediction = require("../models/ManualPrediction");

async function runOneTimeCleanup() {
  try {
    console.log("🧹 Starting ONE-TIME cleanup (keeping yesterday + today)...");

    await mongoose.connect(process.env.MONGO_URI);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 2);

    console.log("📅 Cutoff date:", cutoffDate);

    const result = await ManualPrediction.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    console.log(`🧹 Deleted ${result.deletedCount} old predictions`);

    await mongoose.disconnect();
    console.log("✅ Cleanup finished successfully");
  } catch (err) {
    console.error("❌ Cleanup failed:", err);
    await mongoose.disconnect();
  }
}

runOneTimeCleanup();

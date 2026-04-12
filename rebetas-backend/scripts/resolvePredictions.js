require("dotenv").config();

const mongoose = require("mongoose");
const ManualPrediction = require("../models/ManualPrediction");

async function run() {
  try {
    console.log("🚀 Connecting to DB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ Connected to MongoDB");

    const docs = await ManualPrediction.find({ status: "pending" }).sort({
      scheduledFor: 1,
      createdAt: 1,
    });

    console.log("📊 Pending predictions:", docs.length);

    let lossStreak = 0;
    const bulkOps = [];

    for (const doc of docs) {
      let status;

      // 🚫 BLOCK 3 LOSSES IN A ROW
      if (lossStreak >= 2) {
        status = "won";
        lossStreak = 0;
      } else {
        if (Math.random() < 0.7) {
          status = "won";
          lossStreak = 0;
        } else {
          status = "loss";
          lossStreak++;
        }
      }

      bulkOps.push({
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: { status },
          },
        },
      });
    }

    if (bulkOps.length > 0) {
      await ManualPrediction.bulkWrite(bulkOps);
    }

    console.log("🎉 DONE: Predictions updated successfully");

    await mongoose.disconnect();
    console.log("🔌 DB disconnected");
  } catch (err) {
    console.error("❌ ERROR:", err);
    process.exit(1);
  }
}

run();

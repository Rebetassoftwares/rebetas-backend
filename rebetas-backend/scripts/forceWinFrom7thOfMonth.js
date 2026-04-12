require("dotenv").config();

const mongoose = require("mongoose");
const ManualPrediction = require("../models/ManualPrediction");

async function run() {
  try {
    console.log("🚀 Connecting to DB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected");

    const now = new Date();

    // 🔥 build "10th of current month" at 00:00
    const fromDate = new Date(now.getFullYear(), now.getMonth(), 11);

    console.log("📅 From date:", fromDate);

    const docs = await ManualPrediction.find({
      scheduledFor: { $gte: fromDate },
    }).lean();

    console.log("📊 Found:", docs.length);

    const bulkOps = docs.map((doc) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { status: "won" } },
      },
    }));

    if (bulkOps.length > 0) {
      console.log("⚡ Updating to WON...");
      await ManualPrediction.bulkWrite(bulkOps, { ordered: false });
    }

    console.log("🎉 DONE: All predictions from 7th set to WON");

    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ ERROR:", err);
    process.exit(1);
  }
}

run();

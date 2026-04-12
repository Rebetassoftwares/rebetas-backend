const mongoose = require("mongoose");
require("dotenv").config();

const ManualPrediction = require("./models/ManualPrediction");
const {
  recomputeMartingale,
} = require("./services/martingaleRecomputeService");

async function run() {
  try {
    console.log("🚀 Connecting to DB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ DB connected");

    console.log("🔍 Finding affected leagues...");

    // 🔥 Get ONLY leagues that have data (dynamic, not hardcoded)
    const affected = await ManualPrediction.aggregate([
      {
        $group: {
          _id: {
            platform: "$platform",
            leagueName: "$leagueName",
          },
        },
      },
    ]);

    console.log(`📊 Found ${affected.length} leagues`);

    console.log("⚡ Starting recompute per league...");

    for (const item of affected) {
      const { platform, leagueName } = item._id;

      if (!platform || !leagueName) continue;

      console.log(`➡ Recomputing: ${platform} - ${leagueName}`);

      try {
        await recomputeMartingale(platform, leagueName);
      } catch (err) {
        console.error(`❌ Failed for ${platform} - ${leagueName}`, err.message);
      }
    }

    console.log("🎉 ALL RECOMPUTES COMPLETED");
  } catch (err) {
    console.error("❌ Recompute failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 DB disconnected");
    process.exit();
  }
}

run();

const mongoose = require("mongoose");
require("dotenv").config();

const {
  recomputeMartingale,
} = require("./services/martingaleRecomputeService");

async function run() {
  try {
    console.log("Connecting to DB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ DB connected");

    console.log("Starting recompute...");

    await recomputeMartingale("BET9JA", "Bundesliga");

    console.log("✅ Recompute completed successfully");
  } catch (err) {
    console.error("❌ Recompute failed:", err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

run();

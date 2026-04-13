const cron = require("node-cron");
const cleanupOldPredictions = require("./cleanupService");

function startCleanupScheduler() {
  console.log("🗓️ Nightly cleanup scheduler started");

  // Runs every day at 3:00 AM
  cron.schedule("0 3 * * *", async () => {
    console.log("🧹 Running nightly cleanup job...");
    await cleanupOldPredictions();
  });
}

module.exports = startCleanupScheduler;

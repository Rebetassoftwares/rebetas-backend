const cleanupOldPredictions = require("./cleanupService");

let lastRunDate = null;

function startCleanupScheduler() {
  console.log("🗓️ Cleanup scheduler started");

  setInterval(
    async () => {
      const now = new Date();

      const day = now.getDay(); // 0 = Sunday
      const hour = now.getHours();

      // ✅ Run Sunday between 2AM–3AM
      if (day === 0 && hour === 2) {
        const today = now.toDateString();

        // ✅ Prevent multiple runs same day
        if (lastRunDate === today) return;

        console.log("🧹 Running weekly cleanup...");

        await cleanupOldPredictions();

        lastRunDate = today;
      }
    },
    60 * 60 * 1000,
  ); // check every hour
}

module.exports = startCleanupScheduler;

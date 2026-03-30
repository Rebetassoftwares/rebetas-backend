const Prediction = require("../models/Prediction");
const ManualPrediction = require("../models/ManualPrediction");

/*
GET HISTORY (NEW ENGINE)
- Uses ManualPrediction (REAL SOURCE)
- Keeps frontend format intact
*/
async function getHistory(req, res) {
  try {
    const { platform, league } = req.params;

    const normalizedPlatform = String(platform).toLowerCase();
    const normalizedLeague = String(league).trim();

    const predictions = await ManualPrediction.find({
      platform: normalizedPlatform,
      leagueName: normalizedLeague,
      status: { $in: ["won", "loss"] }, // only resolved
    })
      .sort({ scheduledFor: -1, createdAt: -1 })
      .lean();

    // 🔥 MAP TO FRONTEND FORMAT (IMPORTANT)
    const history = predictions.map((p) => {
      const match =
        p.homeTeam && p.awayTeam
          ? `${p.homeTeam} vs ${p.awayTeam}`
          : p.team || "Unknown Match";

      const safeDate = p.scheduledFor ? new Date(p.scheduledFor) : new Date();

      const formattedDate = safeDate.toISOString().split("T")[0];

      const month = safeDate.toLocaleString("default", {
        month: "long",
      });

      function getISOWeek(dateInput) {
        const d = new Date(dateInput);
        const utc = new Date(
          Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
        );
        const dayNum = utc.getUTCDay() || 7;
        utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
        return String(Math.ceil(((utc - yearStart) / 86400000 + 1) / 7));
      }

      return {
        _id: p._id,
        platform: normalizedPlatform,
        league: normalizedLeague,
        match,
        odd: p.odd,
        stake: p.stake,
        resultAmount: p.resultAmount,
        profit: p.profit,
        capitalAfter: p.capitalAfter,
        resultStatus: p.status === "won" ? "WIN" : "LOSS",
        date: formattedDate,
        month,
        week: getISOWeek(safeDate),
      };
    });

    res.json(history);
  } catch (error) {
    console.error("History error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
}

/*
STORE PREDICTION INTO HISTORY
- Ensures consistency for:
  - platform + league (martingale key)
  - time fields (real-world timing)
*/
async function storePrediction(record) {
  try {
    if (!record || typeof record !== "object") {
      return null;
    }

    const now = new Date();

    // 🔥 Use provided date or fallback to now
    const baseDate = record.date ? new Date(record.date) : now;

    const safeDate = !Number.isNaN(baseDate.getTime()) ? baseDate : now;

    const formattedDate = safeDate.toISOString().split("T")[0];

    const formattedMonth = safeDate.toLocaleString("default", {
      month: "long",
    });

    // ISO week calculation (real-world week)
    function getISOWeek(dateInput) {
      const d = new Date(dateInput);

      if (Number.isNaN(d.getTime())) return null;

      const utc = new Date(
        Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
      );
      const dayNum = utc.getUTCDay() || 7;

      utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);

      const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));

      return String(Math.ceil(((utc - yearStart) / 86400000 + 1) / 7));
    }

    return await Prediction.create({
      ...record,

      // 🔥 Enforce martingale alignment
      platform: String(record.platform).toLowerCase(),
      league: String(record.league).trim(),

      // 🔥 Ensure time consistency (real-world)
      date: record.date || formattedDate,
      month: record.month || formattedMonth,
      week: record.week || getISOWeek(safeDate),
    });
  } catch (error) {
    console.error("Store prediction error:", error.message);
    return null;
  }
}

module.exports = {
  getHistory,
  storePrediction,
};

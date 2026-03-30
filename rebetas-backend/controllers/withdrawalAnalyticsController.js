const PromoWithdrawal = require("../models/PromoWithdrawal");

async function getWithdrawalAnalytics(req, res) {
  try {
    const withdrawals = await PromoWithdrawal.find({})
      .sort({ createdAt: -1 })
      .lean();

    const overview = {
      totalRequestedAmount: 0,
      totalPaidAmount: 0,
      totalRejectedAmount: 0,
      totalFailedAmount: 0,
      totalPendingAmount: 0,
      totalApprovedAmount: 0,
      totalProcessingAmount: 0,
      totalFees: 0,
      countPending: 0,
      countApproved: 0,
      countProcessing: 0,
      countPaid: 0,
      countRejected: 0,
      countFailed: 0,
    };

    const byCurrencyMap = {};
    const trendMap = {};

    withdrawals.forEach((w) => {
      const amount = Number(w.amount || 0);
      const feeAmount = Number(w.feeAmount || 0);
      const currency = w.currency || "UNKNOWN";
      const dateKey = new Date(w.createdAt).toISOString().slice(0, 10);

      overview.totalRequestedAmount += amount;
      overview.totalFees += feeAmount;

      if (w.status === "pending") {
        overview.totalPendingAmount += amount;
        overview.countPending += 1;
      }

      if (w.status === "approved") {
        overview.totalApprovedAmount += amount;
        overview.countApproved += 1;
      }

      if (w.status === "processing") {
        overview.totalProcessingAmount += amount;
        overview.countProcessing += 1;
      }

      if (w.status === "paid") {
        overview.totalPaidAmount += amount;
        overview.countPaid += 1;
      }

      if (w.status === "rejected") {
        overview.totalRejectedAmount += amount;
        overview.countRejected += 1;
      }

      if (w.status === "failed") {
        overview.totalFailedAmount += amount;
        overview.countFailed += 1;
      }

      if (!byCurrencyMap[currency]) {
        byCurrencyMap[currency] = {
          currency,
          requested: 0,
          pending: 0,
          approved: 0,
          processing: 0,
          paid: 0,
          rejected: 0,
          failed: 0,
          fees: 0,
        };
      }

      byCurrencyMap[currency].requested += amount;
      byCurrencyMap[currency].fees += feeAmount;

      if (byCurrencyMap[currency][w.status] !== undefined) {
        byCurrencyMap[currency][w.status] += amount;
      }

      if (!trendMap[dateKey]) {
        trendMap[dateKey] = {
          date: dateKey,
          requested: 0,
          paid: 0,
          failed: 0,
          fees: 0,
        };
      }

      trendMap[dateKey].requested += amount;
      trendMap[dateKey].fees += feeAmount;

      if (w.status === "paid") {
        trendMap[dateKey].paid += amount;
      }

      if (w.status === "failed") {
        trendMap[dateKey].failed += amount;
      }
    });

    res.json({
      overview,
      byCurrency: Object.values(byCurrencyMap),
      trend: Object.values(trendMap).sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    });
  } catch (error) {
    console.error("Withdrawal analytics error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
}

module.exports = {
  getWithdrawalAnalytics,
};

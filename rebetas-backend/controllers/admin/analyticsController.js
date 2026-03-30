const User = require("../../models/User");
const Subscription = require("../../models/Subscription");
const Payment = require("../../models/Payment");
const PromoWallet = require("../../models/PromoWallet"); // ✅ FIXED SOURCE

async function getDashboard(req, res) {
  console.log("🔥 DASHBOARD CONTROLLER HIT");

  try {
    const now = new Date();

    const totalUsers = await User.countDocuments();

    const activeSubscriptions = await Subscription.countDocuments({
      status: "active",
      endDate: { $gt: now },
    });

    /* ---------------- REVENUE (GROUP BY CURRENCY) ---------------- */

    let revenue = [];

    try {
      const payments = await Payment.aggregate([
        { $match: { status: "success" } },
        {
          $group: {
            _id: "$currency",
            total: {
              $sum: {
                $cond: [{ $isNumber: "$amount" }, "$amount", 0],
              },
            },
          },
        },
      ]);

      revenue = payments.map((item) => ({
        currency: item._id,
        total: item.total,
      }));
    } catch (err) {
      console.error("Payment aggregation error:", err.message);
      revenue = [];
    }

    /* ---------------- PROMO EARNINGS (FROM WALLET) ---------------- */

    /* ---------------- PROMO WALLET BREAKDOWN ---------------- */

    let promoStats = [];

    try {
      const wallets = await PromoWallet.find().lean();

      promoStats = wallets.map((wallet) => ({
        currency: wallet.currency,

        totalEarned: wallet.totalEarned || 0,
        balance: wallet.balance || 0,
        pending: wallet.pendingBalance || 0,
        withdrawn: wallet.totalWithdrawn || 0,

        // optional alias (same as withdrawn)
        paidOut: wallet.totalWithdrawn || 0,
      }));
    } catch (err) {
      console.error("Promo wallet error:", err.message);
      promoStats = [];
    }

    /* ---------------- RESPONSE ---------------- */

    res.json({
      users: totalUsers || 0,
      activeSubscriptions: activeSubscriptions || 0,
      revenue,
      promoStats, // 🔥 NEW STRUCTURE
    });
  } catch (error) {
    console.error("Dashboard error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
}

module.exports = {
  getDashboard,
};

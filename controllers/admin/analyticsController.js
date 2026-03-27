const User = require("../../models/User");
const Subscription = require("../../models/Subscription");
const Payment = require("../../models/Payment");
const PromoCode = require("../../models/PromoCode");

async function getDashboard(req, res) {
  console.log("🔥 DASHBOARD CONTROLLER HIT");

  try {
    const now = new Date();

    const totalUsers = await User.countDocuments();

    const activeSubscriptions = await Subscription.countDocuments({
      status: "active",
      endDate: { $gt: now },
    });

    /* ---------------- SAFE PAYMENT AGGREGATION ---------------- */

    let revenue = 0;

    try {
      const payments = await Payment.aggregate([
        { $match: { status: "success" } },
        {
          $group: {
            _id: null,
            revenue: {
              $sum: {
                $cond: [{ $isNumber: "$amount" }, "$amount", 0],
              },
            },
          },
        },
      ]);

      revenue = payments.length ? payments[0].revenue : 0;
    } catch (err) {
      console.error("Payment aggregation error:", err.message);
      revenue = 0;
    }

    /* ---------------- SAFE PROMO AGGREGATION ---------------- */

    let promoEarnings = 0;

    try {
      const promoAgg = await PromoCode.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $cond: [{ $isNumber: "$totalEarned" }, "$totalEarned", 0],
              },
            },
          },
        },
      ]);

      promoEarnings = promoAgg.length ? promoAgg[0].total : 0;
    } catch (err) {
      console.error("Promo aggregation error:", err.message);
      promoEarnings = 0;
    }

    /* ---------------- RESPONSE ---------------- */

    res.json({
      users: totalUsers || 0,
      activeSubscriptions: activeSubscriptions || 0,
      revenue,
      promoEarnings,
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

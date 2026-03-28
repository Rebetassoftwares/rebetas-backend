const Subscription = require("../models/Subscription");
const CountryPricing = require("../models/CountryPricing");
const PromoCode = require("../models/PromoCode");
const User = require("../models/User");

// ✅ NEW (IMPORTANT)
const { creditPromoCommission } = require("../services/promoWalletService");

function calculateEndDate(plan, startDate) {
  const end = new Date(startDate);

  if (plan === "weekly") end.setDate(end.getDate() + 7);
  if (plan === "monthly") end.setMonth(end.getMonth() + 1);
  if (plan === "yearly") end.setFullYear(end.getFullYear() + 1);

  return end;
}

async function createSubscription(req, res) {
  try {
    const userId = req.user._id;

    const { plan, country } = req.body;

    if (!plan || !country) {
      return res.status(400).json({
        message: "Plan and country are required",
      });
    }

    if (!["weekly", "monthly", "yearly"].includes(plan)) {
      return res.status(400).json({
        message: "Invalid subscription plan",
      });
    }

    /* ---------------- FIND COUNTRY PRICING ---------------- */

    const pricing = await CountryPricing.findOne({ country });

    if (!pricing) {
      return res.status(404).json({
        message: "Pricing for selected country not found",
      });
    }

    /* ---------------- DETERMINE PLAN PRICE ---------------- */

    let amount = 0;

    if (plan === "weekly") amount = pricing.weeklyPrice;
    if (plan === "monthly") amount = pricing.monthlyPrice;
    if (plan === "yearly") amount = pricing.yearlyPrice;

    if (!amount) {
      return res.status(400).json({
        message: "Invalid pricing configuration",
      });
    }

    /* ---------------- CHECK USER PROMO CODE ---------------- */

    const user = await User.findById(userId);

    let promoCode = null;

    if (user.promoCodeUsed) {
      const promo = await PromoCode.findOne({
        code: user.promoCodeUsed,
        active: true,
      });

      if (promo) {
        promoCode = promo.code;
      }
    }

    /* ---------------- CREATE SUBSCRIPTION ---------------- */

    const startDate = new Date();
    const endDate = calculateEndDate(plan, startDate);

    const subscription = await Subscription.create({
      userId,
      plan,
      country: pricing.country,
      currency: pricing.currency,
      amount,
      promoCode,
      commissionAmount: 0, // will be updated after wallet logic
      startDate,
      endDate,
      status: "active",
    });

    /* ---------------- CREDIT PROMO (NEW SYSTEM) ---------------- */

    let commissionAmount = 0;

    if (promoCode) {
      const promo = await PromoCode.findOne({
        code: promoCode,
        active: true,
      });

      if (promo) {
        const result = await creditPromoCommission({
          promoCodeId: promo._id,
          subscribedUserId: user._id,
          subscriptionId: subscription._id,
          paymentId: null,
          amount,
          currency: pricing.currency,
          note: "Subscription commission",
        });

        commissionAmount = result.commissionAmount;

        // ✅ update subscription with correct commission
        subscription.commissionAmount = commissionAmount;
        await subscription.save();
      }
    }

    /* ---------------- RESPONSE ---------------- */

    res.status(201).json(subscription);
  } catch (error) {
    console.error("Subscription error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
}

async function checkSubscription(req, res) {
  try {
    const userId = req.user._id;

    const now = new Date();

    const subscription = await Subscription.findOne({
      userId,
      status: "active",
      endDate: { $gt: now },
    }).lean();

    res.json({
      active: !!subscription,
      subscription: subscription || null,
    });
  } catch (error) {
    console.error("Subscription check error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
}

module.exports = {
  createSubscription,
  checkSubscription,
};

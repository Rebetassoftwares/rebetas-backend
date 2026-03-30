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

    /* ---------------- CHECK & APPLY PROMO ---------------- */

    const user = await User.findById(userId);

    let promoCode = null;
    let discountPercent = 0;
    let extraDays = 0;
    let promo = null;

    if (user.promoCodeUsed) {
      promo = await PromoCode.findOne({
        code: user.promoCodeUsed,
        active: true,
      });

      if (promo) {
        promoCode = promo.code;

        // ✅ CHECK USER USAGE LIMIT
        let usage = user.promoUsage?.find((p) => p.code === promo.code);

        if (usage && usage.count >= promo.maxUsesPerUser) {
          return res.status(400).json({
            message: "You have exhausted this promo code",
          });
        }

        // ✅ APPLY DISCOUNT
        discountPercent = promo.discountPercent || 0;

        // ✅ APPLY FREE TIME
        extraDays += promo.freeDays || 0;
        extraDays += (promo.freeWeeks || 0) * 7;

        // ✅ UPDATE USER USAGE
        if (usage) {
          usage.count += 1;
        } else {
          if (!user.promoUsage) user.promoUsage = [];

          user.promoUsage.push({
            code: promo.code,
            count: 1,
          });
        }

        await user.save();
      }
    }

    /* ---------------- APPLY DISCOUNT ---------------- */

    if (discountPercent > 0) {
      amount = amount - (amount * discountPercent) / 100;
    }

    /* ---------------- CREATE SUBSCRIPTION ---------------- */

    const startDate = new Date();

    let endDate = calculateEndDate(plan, startDate);

    // ✅ APPLY EXTRA DAYS
    if (extraDays > 0) {
      endDate.setDate(endDate.getDate() + extraDays);
    }

    const subscription = await Subscription.create({
      userId,
      plan,
      country: pricing.country,
      currency: pricing.currency,
      amount,
      promoCode,
      commissionAmount: 0,
      startDate,
      endDate,
      status: "active",
    });

    /* ---------------- CREDIT PROMO (UNCHANGED LOGIC) ---------------- */

    let commissionAmount = 0;

    if (promoCode && promo) {
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

      subscription.commissionAmount = commissionAmount;
      await subscription.save();
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

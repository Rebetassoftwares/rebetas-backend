const PromoCode = require("../models/PromoCode");
const PromoWallet = require("../models/PromoWallet");
const PromoEarning = require("../models/PromoEarning");
const CountryPricing = require("../models/CountryPricing");

async function getMyPromo(req, res) {
  try {
    const userId = req.user._id;

    const promo = await PromoCode.findOne({ ownerId: userId }).lean();

    if (!promo) {
      return res.status(404).json({
        message: "No promo code found for this user",
      });
    }

    const wallets = await PromoWallet.find({
      ownerId: userId,
    })
      .sort({ currency: 1 })
      .lean();

    const earnings = await PromoEarning.find({
      ownerId: userId,
    })
      .populate("subscribedUserId", "fullName email username")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      promo,
      wallets,
      earnings,
    });
  } catch (error) {
    console.error("User promo error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

/* PREVIEW PROMO CODE
   - Registration screen: send only { code }
   - Subscription screen: send { code, plan, country }
*/
async function previewPromoCode(req, res) {
  try {
    const { code, plan, country } = req.body;

    if (!code) {
      return res.status(400).json({
        valid: false,
        message: "Promo code is required",
      });
    }

    const normalizedCode = String(code).trim().toUpperCase();

    const promo = await PromoCode.findOne({
      code: normalizedCode,
      active: true,
    }).lean();

    if (!promo) {
      return res.status(404).json({
        valid: false,
        message: "Invalid or inactive promo code",
      });
    }

    const freeDaysByPlan = {
      weekly: Number(promo.freeDaysByPlan?.weekly || 0),
      monthly: Number(promo.freeDaysByPlan?.monthly || 0),
      yearly: Number(promo.freeDaysByPlan?.yearly || 0),
    };

    const payload = {
      valid: true,
      code: promo.code,
      ownerName: promo.ownerName,
      discountPercent: Number(promo.discountPercent || 0),
      freeDaysByPlan,
      maxUsesPerUser: Number(promo.maxUsesPerUser || 1),
      active: !!promo.active,
      message: "Promo code is valid",
    };

    if (plan) {
      if (!["weekly", "monthly", "yearly"].includes(plan)) {
        return res.status(400).json({
          valid: false,
          message: "Invalid plan",
        });
      }

      payload.plan = plan;
      payload.freeDays = Number(freeDaysByPlan[plan] || 0);

      if (country) {
        const pricing = await CountryPricing.findOne({ country }).lean();

        if (pricing) {
          let originalPrice = 0;

          if (plan === "weekly")
            originalPrice = Number(pricing.weeklyPrice || 0);
          if (plan === "monthly")
            originalPrice = Number(pricing.monthlyPrice || 0);
          if (plan === "yearly")
            originalPrice = Number(pricing.yearlyPrice || 0);

          const discountPercent = Number(promo.discountPercent || 0);
          const discountedPrice =
            discountPercent > 0
              ? Number(
                  (
                    originalPrice -
                    (originalPrice * discountPercent) / 100
                  ).toFixed(2),
                )
              : originalPrice;

          payload.country = pricing.country;
          payload.currency = pricing.currency;
          payload.originalPrice = originalPrice;
          payload.discountedPrice = discountedPrice;
          payload.savings = Number(
            (originalPrice - discountedPrice).toFixed(2),
          );
        }
      }
    }

    return res.json(payload);
  } catch (error) {
    console.error("Promo preview error:", error.message);
    res.status(500).json({
      valid: false,
      message: "Server error",
    });
  }
}

module.exports = {
  getMyPromo,
  previewPromoCode,
};

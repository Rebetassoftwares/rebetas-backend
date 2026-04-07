const PromoCode = require("../models/PromoCode");
const PromoWallet = require("../models/PromoWallet");

/* CREATE PROMO CODE */
async function createPromoCode(req, res) {
  try {
    const {
      code,
      ownerId,
      ownerName,
      commissionPercent,
      discountPercent,
      freeDaysWeekly,
      freeDaysMonthly,
      freeDaysYearly,
      maxUsesPerUser,
      trialDays, // ✅ NEW
      maxUsers, // ✅ NEW
    } = req.body;

    if (!code || !ownerId || !ownerName || commissionPercent === undefined) {
      return res.status(400).json({
        message: "code, ownerId, ownerName and commissionPercent are required",
      });
    }

    const normalizedCode = String(code).trim().toUpperCase();
    const parsedCommission = Number(commissionPercent);
    const parsedTrialDays = trialDays !== undefined ? Number(trialDays) : 0;

    const parsedMaxUsers = maxUsers !== undefined ? Number(maxUsers) : null;
    const parsedDiscount =
      discountPercent !== undefined ? Number(discountPercent) : 0;

    if (
      Number.isNaN(parsedCommission) ||
      parsedCommission < 0 ||
      parsedCommission > 100
    ) {
      return res.status(400).json({
        message: "Commission percent must be between 0 and 100",
      });
    }

    if (
      Number.isNaN(parsedDiscount) ||
      parsedDiscount < 0 ||
      parsedDiscount > 100
    ) {
      return res.status(400).json({
        message: "Discount percent must be between 0 and 100",
      });
    }

    if (Number.isNaN(parsedTrialDays) || parsedTrialDays < 0) {
      return res.status(400).json({
        message: "trialDays must be 0 or greater",
      });
    }

    if (
      parsedMaxUsers !== null &&
      (Number.isNaN(parsedMaxUsers) || parsedMaxUsers < 1)
    ) {
      return res.status(400).json({
        message: "maxUsers must be at least 1",
      });
    }

    const existing = await PromoCode.findOne({
      code: normalizedCode,
    });

    if (existing) {
      return res.status(400).json({
        message: "Promo code already exists",
      });
    }

    const promo = await PromoCode.create({
      code: normalizedCode,
      ownerId,
      ownerName,
      commissionPercent: parsedCommission,
      discountPercent: parsedDiscount,

      freeDaysByPlan: {
        weekly: Number(freeDaysWeekly || 0),
        monthly: Number(freeDaysMonthly || 0),
        yearly: Number(freeDaysYearly || 0),
      },

      maxUsesPerUser: maxUsesPerUser !== undefined ? Number(maxUsesPerUser) : 1,

      // ✅ NEW FEATURES
      trialDays: parsedTrialDays,
      maxUsers: parsedMaxUsers,
    });

    res.status(201).json(promo);
  } catch (error) {
    console.error("Create promo error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

/* GET ALL PROMO CODES */
async function getPromoCodes(req, res) {
  try {
    const promos = await PromoCode.find({}).sort({ createdAt: -1 }).lean();

    const ownerIds = promos.map((p) => p.ownerId).filter(Boolean);

    const wallets = await PromoWallet.find({
      ownerId: { $in: ownerIds },
    }).lean();

    const walletsByOwner = {};
    for (const wallet of wallets) {
      const key = wallet.ownerId.toString();

      if (!walletsByOwner[key]) walletsByOwner[key] = [];

      walletsByOwner[key].push({
        currency: wallet.currency,
        balance: wallet.balance,
        totalEarned: wallet.totalEarned,
        pendingBalance: wallet.pendingBalance,
        totalWithdrawn: wallet.totalWithdrawn,
      });
    }

    const enriched = promos.map((promo) => ({
      ...promo,
      wallets: promo.ownerId
        ? walletsByOwner[promo.ownerId.toString()] || []
        : [],
    }));

    res.json(enriched);
  } catch (error) {
    console.error("Promo list error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

/* UPDATE PROMO CODE */
async function updatePromoCode(req, res) {
  try {
    const { id } = req.params;
    const {
      ownerId,
      ownerName,
      commissionPercent,
      active,
      discountPercent,
      freeDaysWeekly,
      freeDaysMonthly,
      freeDaysYearly,
      maxUsesPerUser,
      trialDays, // ✅ NEW
      maxUsers, // ✅ NEW
    } = req.body;

    const updateData = {
      ...(ownerId !== undefined && { ownerId }),
      ...(ownerName !== undefined && { ownerName }),
      ...(commissionPercent !== undefined && {
        commissionPercent: Number(commissionPercent),
      }),
      ...(active !== undefined && { active }),
      ...(discountPercent !== undefined && {
        discountPercent: Number(discountPercent),
      }),
      ...((freeDaysWeekly !== undefined ||
        freeDaysMonthly !== undefined ||
        freeDaysYearly !== undefined) && {
        freeDaysByPlan: {
          weekly: Number(freeDaysWeekly || 0),
          monthly: Number(freeDaysMonthly || 0),
          yearly: Number(freeDaysYearly || 0),
        },
      }),
      ...(maxUsesPerUser !== undefined && {
        maxUsesPerUser: Number(maxUsesPerUser),
      }),

      ...(trialDays !== undefined && {
        trialDays: Number(trialDays),
      }),

      ...(maxUsers !== undefined && {
        maxUsers: maxUsers === null ? null : Number(maxUsers),
      }),
    };

    if (
      updateData.commissionPercent !== undefined &&
      (Number.isNaN(updateData.commissionPercent) ||
        updateData.commissionPercent < 0 ||
        updateData.commissionPercent > 100)
    ) {
      return res.status(400).json({
        message: "Commission percent must be between 0 and 100",
      });
    }

    if (
      updateData.discountPercent !== undefined &&
      (Number.isNaN(updateData.discountPercent) ||
        updateData.discountPercent < 0 ||
        updateData.discountPercent > 100)
    ) {
      return res.status(400).json({
        message: "Discount percent must be between 0 and 100",
      });
    }

    if (
      updateData.trialDays !== undefined &&
      (Number.isNaN(updateData.trialDays) || updateData.trialDays < 0)
    ) {
      return res.status(400).json({
        message: "trialDays must be 0 or greater",
      });
    }

    if (
      updateData.maxUsers !== undefined &&
      updateData.maxUsers !== null &&
      (Number.isNaN(updateData.maxUsers) || updateData.maxUsers < 1)
    ) {
      return res.status(400).json({
        message: "maxUsers must be at least 1",
      });
    }

    const updated = await PromoCode.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({
        message: "Promo code not found",
      });
    }

    res.json(updated);
  } catch (error) {
    console.error("Promo update error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

/* DELETE PROMO CODE */
async function deletePromoCode(req, res) {
  try {
    const { id } = req.params;

    await PromoCode.findByIdAndDelete(id);

    res.json({
      message: "Promo code deleted",
    });
  } catch (error) {
    console.error("Promo delete error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  createPromoCode,
  getPromoCodes,
  updatePromoCode,
  deletePromoCode,
};

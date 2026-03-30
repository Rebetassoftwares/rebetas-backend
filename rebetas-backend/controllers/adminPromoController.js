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
      freeDays,
      freeWeeks,
      maxUsesPerUser,
    } = req.body;

    if (!code || !ownerId || !ownerName || commissionPercent === undefined) {
      return res.status(400).json({
        message: "code, ownerId, ownerName and commissionPercent are required",
      });
    }

    const existing = await PromoCode.findOne({
      code: code.toUpperCase(),
    });

    if (existing) {
      return res.status(400).json({
        message: "Promo code already exists",
      });
    }

    const promo = await PromoCode.create({
      code: code.toUpperCase(),
      ownerId,
      ownerName,
      commissionPercent: Number(commissionPercent),
      discountPercent:
        discountPercent !== undefined ? Number(discountPercent) : 0,
      freeDays: freeDays !== undefined ? Number(freeDays) : 0,
      freeWeeks: freeWeeks !== undefined ? Number(freeWeeks) : 0,
      maxUsesPerUser: maxUsesPerUser !== undefined ? Number(maxUsesPerUser) : 1,
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

    const ownerIds = promos.map((p) => p.ownerId);
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
      wallets: walletsByOwner[promo.ownerId.toString()] || [],
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
      freeDays,
      freeWeeks,
      maxUsesPerUser,
    } = req.body;

    const updated = await PromoCode.findByIdAndUpdate(
      id,
      {
        ...(ownerId !== undefined && { ownerId }),
        ...(ownerName !== undefined && { ownerName }),
        ...(commissionPercent !== undefined && {
          commissionPercent: Number(commissionPercent),
        }),
        ...(active !== undefined && { active }),

        ...(discountPercent !== undefined && {
          discountPercent: Number(discountPercent),
        }),
        ...(freeDays !== undefined && { freeDays: Number(freeDays) }),
        ...(freeWeeks !== undefined && { freeWeeks: Number(freeWeeks) }),
        ...(maxUsesPerUser !== undefined && {
          maxUsesPerUser: Number(maxUsesPerUser),
        }),
      },
      { new: true },
    );

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

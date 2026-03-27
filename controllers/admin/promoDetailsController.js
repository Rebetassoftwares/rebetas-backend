const PromoCode = require("../../models/PromoCode");
const PromoWallet = require("../../models/PromoWallet");
const PromoEarning = require("../../models/PromoEarning");

async function getPromoDetails(req, res) {
  try {
    const promo = await PromoCode.findById(req.params.id).lean();

    if (!promo) {
      return res.status(404).json({ message: "Promo code not found" });
    }

    const wallets = await PromoWallet.find({
      ownerId: promo.ownerId,
    })
      .sort({ currency: 1 })
      .lean();

    const earnings = await PromoEarning.find({
      promoCodeId: promo._id,
    })
      .populate("subscribedUserId", "fullName email username country")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      promo,
      wallets,
      earnings,
    });
  } catch (error) {
    console.error("Promo details error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getPromoDetails,
};

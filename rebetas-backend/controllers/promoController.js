const PromoCode = require("../models/PromoCode");
const PromoWallet = require("../models/PromoWallet");
const PromoEarning = require("../models/PromoEarning");

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

module.exports = {
  getMyPromo,
};

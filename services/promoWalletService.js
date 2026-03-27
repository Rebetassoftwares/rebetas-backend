const PromoWallet = require("../models/PromoWallet");
const PromoEarning = require("../models/PromoEarning");
const PromoCode = require("../models/PromoCode");

async function findOrCreateWallet(ownerId, currency, session = null) {
  let wallet = await PromoWallet.findOne({ ownerId, currency }).session(
    session,
  );

  if (!wallet) {
    wallet = await PromoWallet.create(
      [
        {
          ownerId,
          currency,
          balance: 0,
          totalEarned: 0,
          totalWithdrawn: 0,
          pendingBalance: 0,
        },
      ],
      session ? { session } : {},
    );

    wallet = wallet[0];
  }

  return wallet;
}

async function creditPromoCommission({
  promoCodeId,
  subscribedUserId,
  subscriptionId,
  paymentId = null,
  amount,
  currency,
  note = "",
  session = null,
}) {
  const promo = await PromoCode.findById(promoCodeId).session(session);

  if (!promo) {
    throw new Error("Promo code not found");
  }

  if (!promo.active) {
    throw new Error("Promo code is inactive");
  }

  const commissionAmount = Number(
    ((Number(amount) * Number(promo.commissionPercent)) / 100).toFixed(2),
  );

  const wallet = await findOrCreateWallet(promo.ownerId, currency, session);

  await PromoEarning.create(
    [
      {
        promoCodeId: promo._id,
        promoCode: promo.code,
        ownerId: promo.ownerId,
        subscribedUserId,
        subscriptionId,
        paymentId,
        amount,
        currency,
        commissionPercent: promo.commissionPercent,
        commissionAmount,
        status: "available",
        note,
      },
    ],
    session ? { session } : {},
  );

  wallet.balance += commissionAmount;
  wallet.totalEarned += commissionAmount;
  await wallet.save(session ? { session } : {});

  promo.usageCount += 1;
  await promo.save(session ? { session } : {});

  return {
    promo,
    wallet,
    commissionAmount,
  };
}

module.exports = {
  findOrCreateWallet,
  creditPromoCommission,
};

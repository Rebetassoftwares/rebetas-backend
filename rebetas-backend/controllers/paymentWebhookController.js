const Payment = require("../models/Payment");
const Subscription = require("../models/Subscription");
const User = require("../models/User");
const PromoCode = require("../models/PromoCode");

const {
  verifyPaystackWebhook,
  extractPaystackWebhookData,
} = require("../services/payments/paystackService");

const {
  verifyFlutterwaveWebhook,
  extractFlutterwaveWebhookData,
} = require("../services/payments/flutterwaveService");

async function handleWebhook(req, res) {
  try {
    /*
    PAYSTACK WEBHOOK
    */
    if (req.headers["x-paystack-signature"]) {
      if (!verifyPaystackWebhook(req)) {
        return res.status(400).send("Invalid Paystack webhook");
      }

      const webhookData = extractPaystackWebhookData(req.body);

      if (!webhookData) {
        return res.status(200).send("Webhook ignored");
      }

      await activateSubscription(
        webhookData.reference,
        webhookData.providerTransactionId,
      );

      return res.status(200).send("Webhook processed");
    }

    /*
    FLUTTERWAVE WEBHOOK
    */
    if (req.headers["verif-hash"]) {
      if (!verifyFlutterwaveWebhook(req)) {
        return res.status(400).send("Invalid Flutterwave webhook");
      }

      const webhookData = extractFlutterwaveWebhookData(req.body);

      if (!webhookData) {
        return res.status(200).send("Webhook ignored");
      }

      await activateSubscription(
        webhookData.reference,
        webhookData.providerTransactionId,
      );

      return res.status(200).send("Webhook processed");
    }

    return res.status(400).send("Unknown provider");
  } catch (error) {
    console.error("Webhook error:", error.message);
    return res.status(500).send("Webhook error");
  }
}

async function activateSubscription(reference, providerTransactionId = null) {
  const payment = await Payment.findOne({ reference });

  if (!payment) return;

  /*
  PREVENT DUPLICATE PROCESSING
  */
  if (payment.status === "success") return;

  payment.status = "success";

  if (providerTransactionId) {
    payment.providerTransactionId = String(providerTransactionId);
  }

  await payment.save();

  const now = new Date();

  /*
  CHECK FOR EXISTING ACTIVE SUBSCRIPTION
  */
  const activeSubscription = await Subscription.findOne({
    userId: payment.userId,
    status: "active",
    endDate: { $gt: now },
  });

  let startDate;
  let endDate;

  if (activeSubscription) {
    /*
    EXTEND CURRENT SUBSCRIPTION
    */
    startDate = activeSubscription.endDate;
    endDate = new Date(activeSubscription.endDate);
  } else {
    /*
    CREATE NEW SUBSCRIPTION
    */
    startDate = now;
    endDate = new Date(now);
  }

  if (payment.plan === "weekly") endDate.setDate(endDate.getDate() + 7);
  if (payment.plan === "monthly") endDate.setMonth(endDate.getMonth() + 1);
  if (payment.plan === "yearly") endDate.setFullYear(endDate.getFullYear() + 1);

  /*
  PROMO COMMISSION LOGIC
  */
  const user = await User.findById(payment.userId);

  let promoCode = null;
  let commissionAmount = 0;

  if (user?.promoCodeUsed) {
    const promo = await PromoCode.findOne({
      code: user.promoCodeUsed,
      active: true,
    });

    if (promo) {
      promoCode = promo.code;
      commissionAmount = (payment.amount * promo.commissionPercent) / 100;

      promo.totalEarned += commissionAmount;
      await promo.save();
    }
  }

  await Subscription.create({
    userId: payment.userId,
    plan: payment.plan,
    country: payment.country,
    currency: payment.currency,
    amount: payment.amount,
    promoCode,
    commissionAmount,
    startDate,
    endDate,
    status: "active",
  });
}

module.exports = {
  handleWebhook,
};

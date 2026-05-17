const Payment = require("../models/Payment");
const Subscription = require("../models/Subscription");
const PromoCode = require("../models/PromoCode");

const {
  verifyPaystackWebhook,
  extractPaystackWebhookData,
} = require("../services/payments/paystackService");

const {
  verifyFlutterwaveWebhook,
  extractFlutterwaveWebhookData,
} = require("../services/payments/flutterwaveService");

function calculatePlanEndDate(plan, startDate) {
  const endDate = new Date(startDate);

  if (plan === "weekly") {
    endDate.setDate(endDate.getDate() + 7);
  }

  if (plan === "monthly") {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  if (plan === "yearly") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  return endDate;
}

async function handleWebhook(req, res) {
  try {
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

  if (payment.status === "success") return;

  payment.status = "success";

  if (providerTransactionId) {
    payment.providerTransactionId = String(providerTransactionId);
  }

  await payment.save();

  const now = new Date();

  const activeSubscription = await Subscription.findOne({
    userId: payment.userId,
    status: "active",
    endDate: { $gt: now },
  });

  let startDate;
  let endDate;

  if (activeSubscription) {
    startDate = activeSubscription.endDate;
    endDate = new Date(activeSubscription.endDate);
  } else {
    startDate = now;
    endDate = new Date(now);
  }

  endDate = calculatePlanEndDate(payment.plan, endDate);

  if (Number(payment.extraDays || 0) > 0) {
    endDate.setDate(endDate.getDate() + Number(payment.extraDays || 0));
  }

  const promoCode = payment.promoCode || null;
  let commissionAmount = Number(payment.commissionAmount || 0);

  if (promoCode) {
    const promo = await PromoCode.findOne({
      code: promoCode,
      active: true,
    });

    if (promo) {
      promo.totalEarnedBase =
        Number(promo.totalEarnedBase || 0) + commissionAmount;

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

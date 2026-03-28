const Payment = require("../models/Payment");
const CountryPricing = require("../models/CountryPricing");
const Subscription = require("../models/Subscription");
const User = require("../models/User");
const PromoCode = require("../models/PromoCode");

const {
  initializePaystackPayment,
  verifyPaystackPayment,
} = require("../services/payments/paystackService");

const {
  initializeFlutterwavePayment,
  verifyFlutterwavePayment,
} = require("../services/payments/flutterwaveService");

function generateReference() {
  return "REB_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
}

async function initializePayment(req, res) {
  try {
    const user = req.user;
    const { plan, country, provider } = req.body;

    if (!["weekly", "monthly", "yearly"].includes(plan)) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    if (!["paystack", "flutterwave"].includes(provider)) {
      return res.status(400).json({ message: "Invalid payment provider" });
    }

    const pricing = await CountryPricing.findOne({ country });

    if (!pricing) {
      return res.status(404).json({ message: "Pricing not found" });
    }

    let amount;

    if (plan === "weekly") amount = pricing.weeklyPrice;
    if (plan === "monthly") amount = pricing.monthlyPrice;
    if (plan === "yearly") amount = pricing.yearlyPrice;

    const reference = generateReference();

    await Payment.create({
      userId: user._id,
      provider,
      reference,
      plan,
      country,
      currency: pricing.currency,
      amount,
      status: "pending",
    });

    let paymentData = null;

    if (provider === "paystack") {
      paymentData = await initializePaystackPayment({
        email: user.email,
        amount,
        currency: pricing.currency, // ✅ FIXED
        reference,
      });
    }

    if (provider === "flutterwave") {
      paymentData = await initializeFlutterwavePayment({
        email: user.email,
        amount,
        currency: pricing.currency,
        reference,
      });
    }

    if (!paymentData) {
      return res.status(500).json({
        message: "Unable to initialize payment",
      });
    }

    return res.json({
      reference,
      paymentData,
    });
  } catch (error) {
    console.error("Payment init error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
}

async function verifyPayment(req, res) {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({ message: "Payment reference is required" });
    }

    const payment = await Payment.findOne({ reference });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.status === "success") {
      return res.json({ message: "Payment already processed" });
    }

    let verified = null;

    if (payment.provider === "paystack") {
      verified = await verifyPaystackPayment(reference);

      if (!verified || verified.status !== "success") {
        return res.status(400).json({ message: "Payment verification failed" });
      }

      await activateSubscription(payment, verified.id);
    }

    if (payment.provider === "flutterwave") {
      verified = await verifyFlutterwavePayment(reference);

      if (!verified || verified.status !== "successful") {
        return res.status(400).json({ message: "Payment verification failed" });
      }

      await activateSubscription(payment, verified.id);
    }

    return res.json({ message: "Payment verified and subscription activated" });
  } catch (error) {
    console.error("Payment verify error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
}

async function activateSubscription(payment, providerTransactionId = null) {
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
  initializePayment,
  verifyPayment,
  activateSubscription,
};

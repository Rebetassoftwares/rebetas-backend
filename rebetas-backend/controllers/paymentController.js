const Payment = require("../models/Payment");
const CountryPricing = require("../models/CountryPricing");
const Subscription = require("../models/Subscription");
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

function getPlanPrice(pricing, plan) {
  if (plan === "weekly") return Number(pricing.weeklyPrice || 0);
  if (plan === "monthly") return Number(pricing.monthlyPrice || 0);
  if (plan === "yearly") return Number(pricing.yearlyPrice || 0);

  return 0;
}

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

function applyDiscount(amount, discountPercent) {
  const discount = Number(discountPercent || 0);

  if (discount <= 0) return Number(amount || 0);

  return Number((amount - (amount * discount) / 100).toFixed(2));
}

async function initializePayment(req, res) {
  try {
    const user = req.user;
    const { plan, country, provider, promoCode } = req.body;

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

    const originalAmount = getPlanPrice(pricing, plan);

    if (!originalAmount || originalAmount <= 0) {
      return res.status(400).json({
        message: "Invalid pricing configuration",
      });
    }

    let amount = originalAmount;
    let discountPercent = 0;
    let extraDays = 0;
    let validPromoCode = null;
    let commissionAmount = 0;

    const normalizedPromoCode = String(promoCode || user?.promoCodeUsed || "")
      .trim()
      .toUpperCase();

    if (normalizedPromoCode) {
      const promo = await PromoCode.findOne({
        code: normalizedPromoCode,
        active: true,
      });

      if (promo) {
        validPromoCode = promo.code;
        discountPercent = Number(promo.discountPercent || 0);
        extraDays = Number(promo.freeDaysByPlan?.[plan] || 0);

        amount = applyDiscount(originalAmount, discountPercent);

        commissionAmount = Number(
          ((amount * Number(promo.commissionPercent || 0)) / 100).toFixed(2),
        );
      }
    }

    const reference = generateReference();

    await Payment.create({
      userId: user._id,
      provider,
      reference,
      plan,
      country,
      currency: pricing.currency,
      amount,
      originalAmount,
      discountPercent,
      extraDays,
      promoCode: validPromoCode,
      commissionAmount,
      status: "pending",
    });

    let paymentData = null;

    if (provider === "paystack") {
      paymentData = await initializePaystackPayment({
        email: user.email,
        amount,
        currency: pricing.currency,
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
      amount,
      originalAmount,
      discountPercent,
      extraDays,
      promoCode: validPromoCode,
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

  let promoCode = payment.promoCode || null;
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
  initializePayment,
  verifyPayment,
  activateSubscription,
};

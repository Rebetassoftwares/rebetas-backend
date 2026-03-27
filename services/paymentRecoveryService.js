const Payment = require("../models/Payment");

const { verifyPaystackPayment } = require("./payments/paystackService");
const { verifyFlutterwavePayment } = require("./payments/flutterwaveService");

const { activateSubscription } = require("../controllers/paymentController");

async function recoverPendingPayments() {
  const pendingPayments = await Payment.find({
    status: "pending",
    createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });

  for (const payment of pendingPayments) {
    try {
      let verified = null;

      if (payment.provider === "paystack") {
        verified = await verifyPaystackPayment(payment.reference);

        if (verified && verified.status === "success") {
          await activateSubscription(payment, verified.id);
        }
      }

      if (payment.provider === "flutterwave") {
        verified = await verifyFlutterwavePayment(payment.reference);

        if (verified && verified.status === "successful") {
          await activateSubscription(payment, verified.id);
        }
      }
    } catch (error) {
      console.error("Recovery error:", error.message);
    }
  }
}

module.exports = {
  recoverPendingPayments,
};

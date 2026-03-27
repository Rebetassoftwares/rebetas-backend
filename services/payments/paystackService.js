const axios = require("axios");
const crypto = require("crypto");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

/*
INITIALIZE PAYMENT
*/

async function initializePaystackPayment({
  email,
  amount,
  currency,
  reference,
}) {
  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100,
        currency,
        reference,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      },
    );

    return response.data.data;
  } catch (error) {
    console.error(
      "Paystack init error:",
      error.response?.data || error.message,
    );
    return null;
  }
}

/*
VERIFY PAYMENT
*/

async function verifyPaystackPayment(reference) {
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      },
    );

    return response.data.data;
  } catch (error) {
    console.error(
      "Paystack verify error:",
      error.response?.data || error.message,
    );
    return null;
  }
}

/*
VERIFY WEBHOOK SIGNATURE
*/

function verifyPaystackWebhook(req) {
  try {
    const signature = req.headers["x-paystack-signature"];

    if (!signature) return false;

    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET)
      .update(JSON.stringify(req.body))
      .digest("hex");

    return hash === signature;
  } catch (error) {
    console.error(
      "Paystack webhook verification error:",
      error.response?.data || error.message,
    );
    return false;
  }
}

/*
EXTRACT WEBHOOK DATA
*/

function extractPaystackWebhookData(body) {
  if (!body || body.event !== "charge.success") {
    return null;
  }

  const data = body.data;

  return {
    reference: data.reference,
    amount: data.amount / 100,
    currency: data.currency,
    status: data.status,
    providerTransactionId: data.id,
  };
}

module.exports = {
  initializePaystackPayment,
  verifyPaystackPayment,
  verifyPaystackWebhook,
  extractPaystackWebhookData,
};

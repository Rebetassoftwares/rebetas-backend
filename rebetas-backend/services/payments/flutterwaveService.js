const axios = require("axios");

const FLW_SECRET = process.env.FLUTTERWAVE_SECRET;
const FLW_WEBHOOK_HASH = process.env.FLUTTERWAVE_WEBHOOK_HASH;

/*
INITIALIZE PAYMENT
*/

async function initializeFlutterwavePayment({
  email,
  amount,
  currency,
  reference,
}) {
  try {
    console.log("🚀 FLW INIT INPUT:", {
      email,
      amount,
      currency,
      reference,
    });

    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref: reference,
        amount: Number(amount),
        currency,
        redirect_url: `${process.env.CLIENT_URL}/payment/verify`,

        customer: {
          email,
        },

        customizations: {
          title: "Rebetas Subscription",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("✅ FLW RESPONSE STATUS:", response.status);
    console.log(
      "✅ FLW FULL RESPONSE:",
      JSON.stringify(response.data, null, 2),
    );

    return response.data.data;
  } catch (error) {
    console.error("❌ FLW ERROR STATUS:", error.response?.status);

    console.error(
      "❌ FLW ERROR DATA:",
      JSON.stringify(error.response?.data, null, 2),
    );

    console.error("❌ FLW ERROR MESSAGE:", error.message);

    return null;
  }
}

/*
VERIFY PAYMENT
*/

async function verifyFlutterwavePayment(reference) {
  try {
    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`,
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET}`,
        },
      },
    );

    return response.data.data;
  } catch (error) {
    console.error("Flutterwave verify error:", error.message);
    return null;
  }
}

/*
VERIFY WEBHOOK SIGNATURE
*/

function verifyFlutterwaveWebhook(req) {
  try {
    const signature = req.headers["verif-hash"];

    if (!signature) return false;

    return signature === FLW_WEBHOOK_HASH;
  } catch (error) {
    console.error("Flutterwave webhook verification error:", error.message);
    return false;
  }
}

/*
EXTRACT WEBHOOK DATA
*/

function extractFlutterwaveWebhookData(body) {
  if (!body || body.event !== "charge.completed") {
    return null;
  }

  const data = body.data;

  return {
    reference: data.tx_ref,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    providerTransactionId: data.id,
  };
}

module.exports = {
  initializeFlutterwavePayment,
  verifyFlutterwavePayment,
  verifyFlutterwaveWebhook,
  extractFlutterwaveWebhookData,
};

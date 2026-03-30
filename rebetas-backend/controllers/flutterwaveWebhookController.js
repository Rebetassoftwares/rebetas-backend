const PromoWithdrawal = require("../models/PromoWithdrawal");
const {
  verifyFlutterwaveWebhook,
  normalizeTransferStatus,
} = require("../services/flutterwaveTransferService");
const {
  markPaidFromWebhook,
  markFailedFromWebhook,
} = require("../services/withdrawalOrchestratorService");

async function handleFlutterwaveWebhook(req, res) {
  try {
    const isValid = verifyFlutterwaveWebhook(req);

    if (!isValid) {
      return res.status(401).json({
        message: "Invalid webhook signature",
      });
    }

    const payload = req.body || {};

    if (payload.event !== "transfer.completed" || !payload.data) {
      return res.status(200).json({ received: true });
    }

    const transferData = payload.data;
    const normalizedStatus = normalizeTransferStatus(transferData.status);

    const withdrawal = await PromoWithdrawal.findOne({
      $or: [
        { reference: transferData.reference || "" },
        { providerTransferId: String(transferData.id || "") },
      ],
    });

    if (!withdrawal) {
      return res.status(200).json({
        received: true,
        ignored: true,
      });
    }

    if (normalizedStatus === "paid") {
      await markPaidFromWebhook({
        withdrawal,
        payload,
      });
    } else if (normalizedStatus === "failed") {
      await markFailedFromWebhook({
        withdrawal,
        payload,
      });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Flutterwave webhook error:", error.message);

    return res.status(500).json({
      message: "Webhook processing failed",
    });
  }
}

module.exports = {
  handleFlutterwaveWebhook,
};

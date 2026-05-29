const Payment = require("../models/Payment");
const InvestmentDeposit = require("../models/InvestmentDeposit");
const PromoWithdrawal = require("../models/PromoWithdrawal");
const InvestmentWithdrawal = require("../models/InvestmentWithdrawal");

const { activateSubscription } = require("./paymentController");

const {
  verifyFlutterwaveWebhook: verifyPaymentWebhook,
} = require("../services/payments/flutterwaveService");

const {
  normalizeTransferStatus,
} = require("../services/flutterwaveTransferService");

const {
  markPaidFromWebhook: markPromoPaidFromWebhook,
  markFailedFromWebhook: markPromoFailedFromWebhook,
} = require("../services/withdrawalOrchestratorService");

const {
  markPaidFromWebhook: markAutoPilotPaidFromWebhook,
  markFailedFromWebhook: markAutoPilotFailedFromWebhook,
} = require("../services/autoPilotWithdrawalService");

function parseWebhookBody(body) {
  if (!body) return {};

  if (Buffer.isBuffer(body)) {
    return JSON.parse(body.toString("utf8"));
  }

  if (typeof body === "string") {
    return JSON.parse(body);
  }

  return body;
}

async function handleFlutterwaveUnifiedWebhook(req, res) {
  try {
    const isValid = verifyPaymentWebhook(req);

    if (!isValid) {
      return res.status(401).json({
        message: "Invalid Flutterwave webhook signature",
      });
    }

    const payload = parseWebhookBody(req.body);
    const event = payload.event;
    const data = payload.data || {};

    console.log("FLW UNIFIED WEBHOOK EVENT:", event);
    console.log(
      "FLW UNIFIED WEBHOOK REFERENCE:",
      data.tx_ref || data.reference,
    );
    console.log("FLW UNIFIED WEBHOOK STATUS:", data.status);

    /*
    PAYMENT EVENTS
    Handles:
    - normal Rebetas subscription payments
    - AutoPilot package activation payment records
    */
    if (event === "charge.completed") {
      const reference = data.tx_ref;

      if (!reference) {
        return res.status(200).json({
          received: true,
          ignored: true,
          reason: "Missing payment reference",
        });
      }

      const payment = await Payment.findOne({ reference });

      if (payment) {
        if (String(data.status).toLowerCase() === "successful") {
          await activateSubscription(payment, data.id ? String(data.id) : null);
        }

        return res.status(200).json({
          received: true,
          handled: "subscription_payment",
        });
      }

      const deposit = await InvestmentDeposit.findOne({
        providerReference: reference,
      });

      if (deposit) {
        deposit.rawProviderResponse = payload;

        if (String(data.status).toLowerCase() === "successful") {
          deposit.providerTransactionId = data.id ? String(data.id) : null;
        }

        await deposit.save();

        return res.status(200).json({
          received: true,
          handled: "autopilot_deposit_recorded",
        });
      }

      return res.status(200).json({
        received: true,
        ignored: true,
        reason: "Payment reference not found",
      });
    }

    /*
    TRANSFER EVENTS
    Handles:
    - AutoPilot withdrawals
    - Promo withdrawals
    */
    if (event === "transfer.completed") {
      const reference = data.reference || "";
      const transferId = data.id ? String(data.id) : "";
      const normalizedStatus = normalizeTransferStatus(data.status);

      const autoPilotWithdrawal = await InvestmentWithdrawal.findOne({
        $or: [
          { reference },
          { providerReference: reference },
          { providerTransferId: transferId },
        ],
      });

      if (autoPilotWithdrawal) {
        if (normalizedStatus === "paid") {
          await markAutoPilotPaidFromWebhook({
            withdrawal: autoPilotWithdrawal,
            payload,
          });
        }

        if (normalizedStatus === "failed") {
          await markAutoPilotFailedFromWebhook({
            withdrawal: autoPilotWithdrawal,
            payload,
          });
        }

        return res.status(200).json({
          received: true,
          handled: "autopilot_withdrawal",
          status: normalizedStatus,
        });
      }

      const promoWithdrawal = await PromoWithdrawal.findOne({
        $or: [{ reference }, { providerTransferId: transferId }],
      });

      if (promoWithdrawal) {
        if (normalizedStatus === "paid") {
          await markPromoPaidFromWebhook({
            withdrawal: promoWithdrawal,
            payload,
          });
        }

        if (normalizedStatus === "failed") {
          await markPromoFailedFromWebhook({
            withdrawal: promoWithdrawal,
            payload,
          });
        }

        return res.status(200).json({
          received: true,
          handled: "promo_withdrawal",
          status: normalizedStatus,
        });
      }

      return res.status(200).json({
        received: true,
        ignored: true,
        reason: "Transfer reference not found",
        reference,
        transferId,
        status: normalizedStatus,
      });
    }

    return res.status(200).json({
      received: true,
      ignored: true,
      event,
    });
  } catch (error) {
    console.error("Unified Flutterwave webhook error:", error.message);

    return res.status(500).json({
      message: "Webhook processing failed",
    });
  }
}

module.exports = {
  handleFlutterwaveUnifiedWebhook,
};

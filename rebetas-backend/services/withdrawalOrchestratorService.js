const mongoose = require("mongoose");
const PromoWallet = require("../models/PromoWallet");
const PromoWithdrawal = require("../models/PromoWithdrawal");
const PayoutDetail = require("../models/PayoutDetail");
const WithdrawalAuditLog = require("../models/WithdrawalAuditLog");
const {
  getTransferFee,
  initiateBankTransfer,
  normalizeTransferStatus,
  generateWithdrawalReference,
} = require("./flutterwaveTransferService");

async function createAuditLog({
  withdrawalId,
  actorId = null,
  actorType,
  action,
  fromStatus = "",
  toStatus = "",
  note = "",
  meta = {},
  session = null,
}) {
  return WithdrawalAuditLog.create(
    [
      {
        withdrawalId,
        actorId,
        actorType,
        action,
        fromStatus,
        toStatus,
        note,
        meta,
      },
    ],
    session ? { session } : {},
  );
}

async function requestWithdrawal({ userId, currency, amount, minimumAmount }) {
  const normalizedCurrency = String(currency || "")
    .toUpperCase()
    .trim();
  const numericAmount = Number(amount);

  if (!normalizedCurrency || !numericAmount) {
    throw new Error("currency and amount are required");
  }

  if (Number.isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error("Invalid withdrawal amount");
  }

  if (minimumAmount && numericAmount < minimumAmount) {
    throw new Error(`Minimum withdrawal is ${minimumAmount}`);
  }
  const payout = await PayoutDetail.findOne({ ownerId: userId }).lean();
  if (!payout) {
    throw new Error("Please set your payment details before withdrawing");
  }

  const existingPending = await PromoWithdrawal.exists({
    ownerId: userId,
    currency: normalizedCurrency,
    status: { $in: ["pending", "approved", "processing"] },
  });

  if (existingPending) {
    throw new Error(
      "You already have an active withdrawal request for this currency",
    );
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const wallet = await PromoWallet.findOne({
      ownerId: userId,
      currency: normalizedCurrency,
    }).session(session);

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    if (wallet.balance < numericAmount) {
      throw new Error("Insufficient balance");
    }

    wallet.balance -= numericAmount;
    wallet.pendingBalance += numericAmount;
    await wallet.save({ session });

    const withdrawal = await PromoWithdrawal.create(
      [
        {
          ownerId: userId,
          walletId: wallet._id,
          currency: wallet.currency,
          amount: numericAmount,
          netAmount: numericAmount,
          feePolicy: "platform_pays",
          feeAmount: 0,
          status: "pending",
          payoutDetails: {
            accountName: payout.accountName,
            accountNumber: payout.accountNumber,
            bankName: payout.bankName,
            bankCode: payout.bankCode,
          },
        },
      ],
      { session },
    );

    await createAuditLog({
      withdrawalId: withdrawal[0]._id,
      actorId: userId,
      actorType: "user",
      action: "withdrawal_requested",
      fromStatus: "",
      toStatus: "pending",
      note: "User requested withdrawal",
      meta: {
        amount: numericAmount,
        currency: wallet.currency,
      },
      session,
    });

    await session.commitTransaction();
    return withdrawal[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

async function approveWithdrawal({ withdrawalId, adminId, adminNote = "" }) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const withdrawal =
      await PromoWithdrawal.findById(withdrawalId).session(session);

    if (!withdrawal) {
      throw new Error("Withdrawal not found");
    }

    if (withdrawal.status !== "pending") {
      throw new Error("Only pending withdrawals can be approved");
    }

    const fromStatus = withdrawal.status;

    withdrawal.status = "approved";
    withdrawal.adminNote = adminNote || "";
    withdrawal.processedBy = adminId;
    withdrawal.processedAt = new Date();

    await withdrawal.save({ session });

    await createAuditLog({
      withdrawalId: withdrawal._id,
      actorId: adminId,
      actorType: "admin",
      action: "withdrawal_approved",
      fromStatus,
      toStatus: "approved",
      note: adminNote || "Withdrawal approved",
      session,
    });

    await session.commitTransaction();
    return withdrawal;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

async function rejectWithdrawal({ withdrawalId, adminId, adminNote = "" }) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const withdrawal =
      await PromoWithdrawal.findById(withdrawalId).session(session);

    if (!withdrawal) {
      throw new Error("Withdrawal not found");
    }

    if (withdrawal.status !== "pending") {
      throw new Error("Only pending withdrawals can be rejected");
    }

    const wallet = await PromoWallet.findById(withdrawal.walletId).session(
      session,
    );

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    wallet.pendingBalance -= withdrawal.amount;
    wallet.balance += withdrawal.amount;
    await wallet.save({ session });

    const fromStatus = withdrawal.status;

    withdrawal.status = "rejected";
    withdrawal.adminNote = adminNote || "";
    withdrawal.processedBy = adminId;
    withdrawal.processedAt = new Date();

    await withdrawal.save({ session });

    await createAuditLog({
      withdrawalId: withdrawal._id,
      actorId: adminId,
      actorType: "admin",
      action: "withdrawal_rejected",
      fromStatus,
      toStatus: "rejected",
      note: adminNote || "Withdrawal rejected",
      session,
    });

    await session.commitTransaction();
    return withdrawal;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

async function payWithdrawal({
  withdrawalId,
  adminId,
  adminNote = "",
  mockSuccess = false,
  mockFailure = false,
}) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const withdrawal =
      await PromoWithdrawal.findById(withdrawalId).session(session);

    if (!withdrawal) {
      throw new Error("Withdrawal not found");
    }

    if (withdrawal.status !== "approved") {
      throw new Error("Only approved withdrawals can be paid");
    }

    const reference = generateWithdrawalReference(withdrawal._id, {
      mockSuccess,
      mockFailure,
    });

    const feeResult = await getTransferFee({
      amount: withdrawal.amount,
      currency: withdrawal.currency,
      type: "account",
    });

    const feeAmount = Number(feeResult.fee || 0);

    // 🔥 5% markup
    const markup = Number((withdrawal.amount * 0.05).toFixed(2));

    // 🔥 total deduction
    const totalFee = feeAmount + markup;

    // ❌ prevent negative payout
    if (withdrawal.amount <= totalFee) {
      throw new Error("Amount too small after fees");
    }

    // ✅ what user receives
    const netAmount = Number((withdrawal.amount - totalFee).toFixed(2));

    const transferResult = await initiateBankTransfer({
      amount: netAmount,
      currency: withdrawal.currency,
      reference,
      payoutDetails: withdrawal.payoutDetails || {},
      narration: `Rebetas promo withdrawal ${withdrawal._id}`,
      meta: {
        withdrawalId: String(withdrawal._id),
        ownerId: String(withdrawal.ownerId),
      },
    });

    const transferData = transferResult?.data || {};
    const transferStatus = normalizeTransferStatus(transferData.status);
    const fromStatus = withdrawal.status;

    withdrawal.status = transferStatus;
    withdrawal.feeAmount = totalFee;
    withdrawal.netAmount = netAmount;
    withdrawal.feePolicy = "user_pays";
    withdrawal.reference = reference;
    withdrawal.providerTransferId = transferData.id
      ? String(transferData.id)
      : "";
    withdrawal.transferMeta = transferData;
    withdrawal.adminNote = adminNote || withdrawal.adminNote || "";
    withdrawal.processedBy = adminId;
    withdrawal.processedAt = new Date();

    if (transferStatus === "failed") {
      const wallet = await PromoWallet.findById(withdrawal.walletId).session(
        session,
      );

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      wallet.pendingBalance -= withdrawal.amount;
      wallet.balance += withdrawal.amount;
      await wallet.save({ session });

      withdrawal.failedAt = new Date();
      withdrawal.failureReason =
        transferData.complete_message || "Transfer initiation failed";
    }

    await withdrawal.save({ session });

    await createAuditLog({
      withdrawalId: withdrawal._id,
      actorId: adminId,
      actorType: "admin",
      action: "withdrawal_payment_initiated",
      fromStatus,
      toStatus: withdrawal.status,
      note: adminNote || "Payout initiated",
      meta: {
        reference,
        providerTransferId: withdrawal.providerTransferId,
        feeAmount,
      },
      session,
    });

    await session.commitTransaction();
    return withdrawal;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

async function markPaidFromWebhook({ withdrawal, payload }) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const fresh = await PromoWithdrawal.findById(withdrawal._id).session(
      session,
    );

    if (!fresh) {
      throw new Error("Withdrawal not found");
    }

    if (fresh.status === "paid") {
      await session.commitTransaction();
      return fresh;
    }

    const wallet = await PromoWallet.findById(fresh.walletId).session(session);

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const fromStatus = fresh.status;

    wallet.pendingBalance -= fresh.amount;
    wallet.totalWithdrawn += fresh.amount;
    await wallet.save({ session });

    fresh.status = "paid";
    fresh.paidAt = new Date();
    fresh.failedAt = null;
    fresh.failureReason = "";
    fresh.transferMeta = payload?.data || fresh.transferMeta;

    if (payload?.data?.id) {
      fresh.providerTransferId = String(payload.data.id);
    }

    if (payload?.data?.reference) {
      fresh.reference = payload.data.reference;
    }

    if (payload?.data?.fee !== undefined && payload?.data?.fee !== null) {
      fresh.feeAmount = Number(payload.data.fee || 0);
    }

    await fresh.save({ session });

    await createAuditLog({
      withdrawalId: fresh._id,
      actorType: "webhook",
      action: "withdrawal_paid_webhook",
      fromStatus,
      toStatus: "paid",
      note: "Flutterwave confirmed successful payout",
      meta: payload?.data || {},
      session,
    });

    await session.commitTransaction();
    return fresh;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

async function markFailedFromWebhook({ withdrawal, payload }) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const fresh = await PromoWithdrawal.findById(withdrawal._id).session(
      session,
    );

    if (!fresh) {
      throw new Error("Withdrawal not found");
    }

    if (fresh.status === "failed") {
      await session.commitTransaction();
      return fresh;
    }

    if (fresh.status === "paid" || fresh.status === "rejected") {
      await session.commitTransaction();
      return fresh;
    }

    const wallet = await PromoWallet.findById(fresh.walletId).session(session);

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const fromStatus = fresh.status;

    wallet.pendingBalance -= fresh.amount;
    wallet.balance += fresh.amount;
    await wallet.save({ session });

    fresh.status = "failed";
    fresh.failedAt = new Date();
    fresh.failureReason =
      payload?.data?.complete_message ||
      payload?.data?.status ||
      "Payout failed";
    fresh.transferMeta = payload?.data || fresh.transferMeta;

    if (payload?.data?.id) {
      fresh.providerTransferId = String(payload.data.id);
    }

    if (payload?.data?.reference) {
      fresh.reference = payload.data.reference;
    }

    if (payload?.data?.fee !== undefined && payload?.data?.fee !== null) {
      fresh.feeAmount = Number(payload.data.fee || 0);
    }

    await fresh.save({ session });

    await createAuditLog({
      withdrawalId: fresh._id,
      actorType: "webhook",
      action: "withdrawal_failed_webhook",
      fromStatus,
      toStatus: "failed",
      note: fresh.failureReason,
      meta: payload?.data || {},
      session,
    });

    await session.commitTransaction();
    return fresh;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

module.exports = {
  createAuditLog,
  requestWithdrawal,
  approveWithdrawal,
  rejectWithdrawal,
  payWithdrawal,
  markPaidFromWebhook,
  markFailedFromWebhook,
};

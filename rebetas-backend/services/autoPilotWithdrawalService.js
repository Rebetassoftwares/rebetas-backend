const mongoose = require("mongoose");

const InvestmentAccount = require("../models/InvestmentAccount");
const InvestmentWithdrawal = require("../models/InvestmentWithdrawal");
const InvestmentTransaction = require("../models/InvestmentTransaction");
const InvestmentWithdrawalAuditLog = require("../models/InvestmentWithdrawalAuditLog");

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
  return InvestmentWithdrawalAuditLog.create(
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

async function approveWithdrawal({ withdrawalId, adminId, adminNote = "" }) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const withdrawal =
      await InvestmentWithdrawal.findById(withdrawalId).session(session);

    if (!withdrawal) {
      throw new Error("Withdrawal request not found");
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

    await InvestmentTransaction.findByIdAndUpdate(
      withdrawal.transactionId,
      {
        status: "processing",
      },
      { session },
    );

    await createAuditLog({
      withdrawalId: withdrawal._id,
      actorId: adminId,
      actorType: "admin",
      action: "withdrawal_approved",
      fromStatus,
      toStatus: "approved",
      note:
        adminNote ||
        `${
          withdrawal.withdrawalType === "capital"
            ? "Capital Withdrawal approved"
            : "Profit Withdrawal approved"
        }`,
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
      await InvestmentWithdrawal.findById(withdrawalId).session(session);

    if (!withdrawal) {
      throw new Error("Withdrawal request not found");
    }

    if (withdrawal.status !== "pending") {
      throw new Error("Only pending withdrawals can be rejected");
    }

    const account = await InvestmentAccount.findById(
      withdrawal.investmentAccountId,
    ).session(session);

    if (!account) {
      throw new Error("AutoPilot account not found");
    }

    if (withdrawal.withdrawalType === "profit") {
      account.profitBalance = Number(
        (Number(account.profitBalance || 0) + withdrawal.amount).toFixed(2),
      );
    }

    if (withdrawal.withdrawalType === "capital") {
      account.capitalBalance = Number(
        (Number(account.capitalBalance || 0) + withdrawal.amount).toFixed(2),
      );

      if (account.status === "closed") {
        account.status = "active";
      }
    }

    await account.save({ session });

    const fromStatus = withdrawal.status;

    withdrawal.status = "rejected";
    withdrawal.adminNote = adminNote || "";
    withdrawal.processedBy = adminId;
    withdrawal.processedAt = new Date();

    await withdrawal.save({ session });

    await InvestmentTransaction.findByIdAndUpdate(
      withdrawal.transactionId,
      {
        status: "rejected",
      },
      { session },
    );

    await createAuditLog({
      withdrawalId: withdrawal._id,
      actorId: adminId,
      actorType: "admin",
      action: "withdrawal_rejected",
      fromStatus,
      toStatus: "rejected",
      note:
        adminNote ||
        `${
          withdrawal.withdrawalType === "capital"
            ? "Capital Withdrawal rejected"
            : "Profit Withdrawal rejected"
        }`,
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
      await InvestmentWithdrawal.findById(withdrawalId).session(session);

    if (!withdrawal) {
      throw new Error("Withdrawal request not found");
    }

    if (withdrawal.status !== "approved") {
      throw new Error("Only approved withdrawals can be paid");
    }

    const account = await InvestmentAccount.findById(
      withdrawal.investmentAccountId,
    ).session(session);

    if (!account) {
      throw new Error("AutoPilot account not found");
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

    const netAmount =
      withdrawal.feePolicy === "platform_pays"
        ? Number(withdrawal.amount.toFixed(2))
        : Number((withdrawal.amount - feeAmount).toFixed(2));

    if (netAmount <= 0) {
      throw new Error("Amount too small after fees");
    }

    const transferResult = await initiateBankTransfer({
      amount: netAmount,
      currency: withdrawal.currency,
      reference,
      payoutDetails: withdrawal.payoutDetails || {},
      narration: `Rebetas AutoPilot ${withdrawal.withdrawalType} withdrawal`,
      meta: {
        withdrawalId: String(withdrawal._id),
        userId: String(withdrawal.userId),
        accountId: String(withdrawal.investmentAccountId),
        withdrawalType: withdrawal.withdrawalType,
      },
    });

    const transferData = transferResult?.data || {};

    const transferStatus = normalizeTransferStatus(transferData.status);

    const fromStatus = withdrawal.status;

    withdrawal.status =
      transferStatus === "paid" ? "successful" : transferStatus;

    withdrawal.feeAmount = feeAmount;
    withdrawal.netAmount = netAmount;
    withdrawal.reference = reference;
    withdrawal.providerReference = reference;

    withdrawal.providerTransferId = transferData.id
      ? String(transferData.id)
      : "";

    withdrawal.transferMeta = transferData;
    withdrawal.rawProviderResponse = transferResult || {};
    withdrawal.adminNote = adminNote || withdrawal.adminNote || "";
    withdrawal.processedBy = adminId;
    withdrawal.processedAt = new Date();

    if (withdrawal.status === "successful") {
      withdrawal.paidAt = new Date();

      if (withdrawal.withdrawalType === "capital") {
        account.status = "closed";

        account.totalCapitalWithdrawn = Number(
          (
            Number(account.totalCapitalWithdrawn || 0) + withdrawal.amount
          ).toFixed(2),
        );
      }

      if (withdrawal.withdrawalType === "profit") {
        account.totalProfitWithdrawn = Number(
          (
            Number(account.totalProfitWithdrawn || 0) + withdrawal.amount
          ).toFixed(2),
        );
      }

      await account.save({ session });
    }

    if (withdrawal.status === "failed") {
      withdrawal.failedAt = new Date();

      withdrawal.failureReason =
        transferData.complete_message || "Transfer initiation failed";

      if (withdrawal.withdrawalType === "profit") {
        account.profitBalance = Number(
          (Number(account.profitBalance || 0) + withdrawal.amount).toFixed(2),
        );
      }

      if (withdrawal.withdrawalType === "capital") {
        account.capitalBalance = Number(
          (Number(account.capitalBalance || 0) + withdrawal.amount).toFixed(2),
        );

        if (account.status === "closed") {
          account.status = "active";
        }
      }

      await account.save({ session });
    }

    await withdrawal.save({ session });

    await InvestmentTransaction.findByIdAndUpdate(
      withdrawal.transactionId,
      {
        status:
          withdrawal.status === "successful"
            ? "successful"
            : withdrawal.status === "failed"
              ? "failed"
              : "processing",
      },
      { session },
    );

    await createAuditLog({
      withdrawalId: withdrawal._id,
      actorId: adminId,
      actorType: "admin",
      action: "withdrawal_payment_initiated",
      fromStatus,
      toStatus: withdrawal.status,
      note:
        adminNote ||
        `${
          withdrawal.withdrawalType === "capital"
            ? "Capital Withdrawal payout initiated"
            : "Profit Withdrawal payout initiated"
        }`,
      meta: {
        reference,
        providerTransferId: withdrawal.providerTransferId,
        feeAmount,
        netAmount,
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

    const fresh = await InvestmentWithdrawal.findById(withdrawal._id).session(
      session,
    );

    if (!fresh) {
      throw new Error("Withdrawal request not found");
    }

    if (fresh.status === "successful") {
      await session.commitTransaction();
      return fresh;
    }

    const account = await InvestmentAccount.findById(
      fresh.investmentAccountId,
    ).session(session);

    if (!account) {
      throw new Error("AutoPilot account not found");
    }

    const fromStatus = fresh.status;

    fresh.status = "successful";
    fresh.paidAt = new Date();
    fresh.failedAt = null;
    fresh.failureReason = "";
    fresh.transferMeta = payload?.data || fresh.transferMeta;
    fresh.rawProviderResponse = payload || fresh.rawProviderResponse;

    if (payload?.data?.id) {
      fresh.providerTransferId = String(payload.data.id);
    }

    if (payload?.data?.reference) {
      fresh.reference = payload.data.reference;
      fresh.providerReference = payload.data.reference;
    }

    if (payload?.data?.fee !== undefined && payload?.data?.fee !== null) {
      fresh.feeAmount = Number(payload.data.fee || 0);
    }

    if (fresh.withdrawalType === "capital") {
      account.status = "closed";

      account.totalCapitalWithdrawn = Number(
        (Number(account.totalCapitalWithdrawn || 0) + fresh.amount).toFixed(2),
      );
    }

    if (fresh.withdrawalType === "profit") {
      account.totalProfitWithdrawn = Number(
        (Number(account.totalProfitWithdrawn || 0) + fresh.amount).toFixed(2),
      );
    }

    await account.save({ session });

    await fresh.save({ session });

    await InvestmentTransaction.findByIdAndUpdate(
      fresh.transactionId,
      {
        status: "successful",
      },
      { session },
    );

    await createAuditLog({
      withdrawalId: fresh._id,
      actorType: "webhook",
      action: "withdrawal_successful_webhook",
      fromStatus,
      toStatus: "successful",
      note:
        fresh.withdrawalType === "capital"
          ? "Capital Withdrawal payout confirmed"
          : "Profit Withdrawal payout confirmed",
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

    const fresh = await InvestmentWithdrawal.findById(withdrawal._id).session(
      session,
    );

    if (!fresh) {
      throw new Error("Withdrawal request not found");
    }

    if (fresh.status === "failed") {
      await session.commitTransaction();
      return fresh;
    }

    if (fresh.status === "successful" || fresh.status === "rejected") {
      await session.commitTransaction();
      return fresh;
    }

    const account = await InvestmentAccount.findById(
      fresh.investmentAccountId,
    ).session(session);

    if (!account) {
      throw new Error("AutoPilot account not found");
    }

    const fromStatus = fresh.status;

    if (fresh.withdrawalType === "profit") {
      account.profitBalance = Number(
        (Number(account.profitBalance || 0) + fresh.amount).toFixed(2),
      );
    }

    if (fresh.withdrawalType === "capital") {
      account.capitalBalance = Number(
        (Number(account.capitalBalance || 0) + fresh.amount).toFixed(2),
      );

      if (account.status === "closed") {
        account.status = "active";
      }
    }

    fresh.status = "failed";
    fresh.failedAt = new Date();

    fresh.failureReason =
      payload?.data?.complete_message ||
      payload?.data?.status ||
      "Withdrawal payout failed";

    fresh.transferMeta = payload?.data || fresh.transferMeta;
    fresh.rawProviderResponse = payload || fresh.rawProviderResponse;

    if (payload?.data?.id) {
      fresh.providerTransferId = String(payload.data.id);
    }

    if (payload?.data?.reference) {
      fresh.reference = payload.data.reference;
      fresh.providerReference = payload.data.reference;
    }

    if (payload?.data?.fee !== undefined && payload?.data?.fee !== null) {
      fresh.feeAmount = Number(payload.data.fee || 0);
    }

    await account.save({ session });

    await fresh.save({ session });

    await InvestmentTransaction.findByIdAndUpdate(
      fresh.transactionId,
      {
        status: "failed",
      },
      { session },
    );

    await createAuditLog({
      withdrawalId: fresh._id,
      actorType: "webhook",
      action: "withdrawal_failed_webhook",
      fromStatus,
      toStatus: "failed",
      note:
        fresh.withdrawalType === "capital"
          ? "Capital Withdrawal payout failed"
          : "Profit Withdrawal payout failed",
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
  approveWithdrawal,
  rejectWithdrawal,
  payWithdrawal,
  markPaidFromWebhook,
  markFailedFromWebhook,
};

const mongoose = require("mongoose");

const InvestmentAccount = require("../models/InvestmentAccount");
const InvestmentTransaction = require("../models/InvestmentTransaction");

async function creditManualProfit(req, res) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { id } = req.params;
    const { amount, reason = "" } = req.body;

    const numericAmount = Number(amount);

    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Valid Profit Credit amount is required",
      });
    }

    const account = await InvestmentAccount.findById(id).session(session);

    if (!account) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "AutoPilot account not found",
      });
    }

    if (account.status !== "active") {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message:
          "Profit Credit can only be applied to an active AutoPilot account",
      });
    }

    const beforeCapital = account.capitalBalance;
    const beforeProfit = account.profitBalance;

    account.profitBalance = Number(
      (Number(account.profitBalance || 0) + numericAmount).toFixed(2),
    );

    account.totalProfitEarned = Number(
      (Number(account.totalProfitEarned || 0) + numericAmount).toFixed(2),
    );

    await account.save({ session });

    const transaction = await InvestmentTransaction.create(
      [
        {
          userId: account.userId,
          investmentAccountId: account._id,
          type: "profit_credit",
          status: "successful",
          amount: numericAmount,
          currency: account.currency,
          balanceBefore: {
            capitalBalance: beforeCapital,
            profitBalance: beforeProfit,
          },
          balanceAfter: {
            capitalBalance: account.capitalBalance,
            profitBalance: account.profitBalance,
          },
          description: reason || "Manual Profit Credit applied by admin",
          metadata: {
            manualCredit: true,
            adminId: req.user?._id || req.user?.id || null,
            reason,
            packageId: account.packageId,
            packageNameSnapshot: account.packageNameSnapshot,
          },
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Manual Profit Credit applied successfully",
      data: {
        account,
        transaction: transaction[0],
      },
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Manual AutoPilot Profit Credit error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to apply Manual Profit Credit",
    });
  } finally {
    session.endSession();
  }
}

module.exports = {
  creditManualProfit,
};

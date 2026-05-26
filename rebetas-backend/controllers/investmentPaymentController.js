const mongoose = require("mongoose");

const InvestmentPackage = require("../models/InvestmentPackage");
const InvestmentAccount = require("../models/InvestmentAccount");
const InvestmentDeposit = require("../models/InvestmentDeposit");
const InvestmentTransaction = require("../models/InvestmentTransaction");

const {
  initializeFlutterwavePayment,
  verifyFlutterwavePayment,
} = require("../services/payments/flutterwaveService");

const { getExchangeRate } = require("../services/exchangeRateService");

function generateAutoPilotReference() {
  return "AP_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
}

const getUserId = (req) => req.user?._id || req.user?.id;

exports.initializeDeposit = async (req, res) => {
  try {
    const user = req.user;
    const userId = getUserId(req);
    const { packageId, displayCurrency } = req.body;

    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: "AutoPilot Package selection is required",
      });
    }

    const selectedPackage = await InvestmentPackage.findOne({
      _id: packageId,
      isActive: true,
    });

    if (!selectedPackage) {
      return res.status(404).json({
        success: false,
        message: "Selected AutoPilot Package not found",
      });
    }

    const existingAccount = await InvestmentAccount.findOne({
      userId,
      status: "active",
    });

    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: "You already have an active AutoPilot account",
      });
    }

    const existingPendingDeposit = await InvestmentDeposit.findOne({
      userId,
      status: { $in: ["pending", "processing"] },
    });

    if (existingPendingDeposit) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending AutoPilot Package payment",
        data: {
          reference: existingPendingDeposit.providerReference,
          paymentLink: existingPendingDeposit.paymentLink,
        },
      });
    }

    const userDisplayCurrency = String(
      displayCurrency || selectedPackage.currency,
    ).toUpperCase();

    let exchangeRateSnapshot = null;

    if (userDisplayCurrency !== selectedPackage.currency) {
      exchangeRateSnapshot = await getExchangeRate({
        fromCurrency: selectedPackage.currency,
        toCurrency: userDisplayCurrency,
      });
    }

    const reference = generateAutoPilotReference();

    const deposit = await InvestmentDeposit.create({
      userId,
      packageId: selectedPackage._id,
      amount: selectedPackage.amount,
      currency: selectedPackage.currency,
      userDisplayCurrency,
      exchangeRateSnapshot,
      provider: "flutterwave",
      providerReference: reference,
      status: "pending",
    });

    const paymentData = await initializeFlutterwavePayment({
      email: user.email,
      amount: selectedPackage.amount,
      currency: selectedPackage.currency,
      reference,
      redirectUrl: `${process.env.CLIENT_URL}/autopilot/payment/verify`,
      title: "Rebetas AutoPilot",
      description: `${selectedPackage.name} AutoPilot Package activation`,
      customer: {
        name: user.fullName,
        phonenumber: user.phone,
      },
      meta: {
        purpose: "autopilot_activation",
        userId: String(userId),
        packageId: String(selectedPackage._id),
      },
    });

    if (!paymentData) {
      deposit.status = "failed";

      await deposit.save();

      return res.status(500).json({
        success: false,
        message: "Unable to initialize AutoPilot Package payment",
      });
    }

    deposit.paymentLink = paymentData.link || null;
    deposit.rawProviderResponse = paymentData;

    await deposit.save();

    return res.status(200).json({
      success: true,
      message: "AutoPilot Package payment initialized successfully",
      data: {
        reference,
        amount: selectedPackage.amount,
        currency: selectedPackage.currency,
        userDisplayCurrency,
        exchangeRateSnapshot,
        paymentLink: deposit.paymentLink,
        paymentData,
      },
    });
  } catch (error) {
    console.error(
      "AutoPilot Package payment initialization error:",
      error.message,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to initialize AutoPilot Package payment",
    });
  }
};

exports.verifyDeposit = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const userId = getUserId(req);
    const { reference } = req.body;

    if (!reference) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Payment reference is required",
      });
    }

    const deposit = await InvestmentDeposit.findOne({
      providerReference: reference,
    }).session(session);

    if (!deposit) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    if (String(deposit.userId) !== String(userId)) {
      await session.abortTransaction();

      return res.status(403).json({
        success: false,
        message: "You cannot verify this payment",
      });
    }

    if (deposit.status === "successful") {
      const existingAccount = await InvestmentAccount.findById(
        deposit.investmentAccountId,
      ).session(session);

      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: "AutoPilot Package payment already verified",
        data: {
          account: existingAccount || null,
        },
      });
    }

    const verified = await verifyFlutterwavePayment(reference);
    const verifiedStatus = String(verified?.status || "").toLowerCase();

    if (!verified || verifiedStatus !== "successful") {
      deposit.status = "failed";
      deposit.rawProviderResponse = verified || {};

      await deposit.save({ session });
      await session.commitTransaction();

      return res.status(400).json({
        success: false,
        message: "AutoPilot Package payment verification failed",
      });
    }

    if (Number(verified.amount) < Number(deposit.amount)) {
      deposit.status = "failed";
      deposit.rawProviderResponse = verified;

      await deposit.save({ session });
      await session.commitTransaction();

      return res.status(400).json({
        success: false,
        message: "AutoPilot Package payment amount could not be confirmed",
      });
    }

    if (
      String(verified.currency).toUpperCase() !==
      String(deposit.currency).toUpperCase()
    ) {
      deposit.status = "failed";
      deposit.rawProviderResponse = verified;

      await deposit.save({ session });
      await session.commitTransaction();

      return res.status(400).json({
        success: false,
        message: "AutoPilot Package payment currency could not be confirmed",
      });
    }

    const selectedPackage = await InvestmentPackage.findOne({
      _id: deposit.packageId,
      isActive: true,
    }).session(session);

    if (!selectedPackage) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "AutoPilot Package is no longer available",
      });
    }

    const existingAccount = await InvestmentAccount.findOne({
      userId: deposit.userId,
      status: "active",
    }).session(session);

    if (existingAccount) {
      deposit.status = "successful";
      deposit.investmentAccountId = existingAccount._id;
      deposit.providerTransactionId = verified.id ? String(verified.id) : null;
      deposit.verifiedAt = new Date();
      deposit.rawProviderResponse = verified;

      await deposit.save({ session });
      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: "AutoPilot Package payment already processed",
        data: {
          account: existingAccount,
        },
      });
    }

    const capitalAmount = Number(Number(selectedPackage.amount).toFixed(2));

    const account = await InvestmentAccount.create(
      [
        {
          userId: deposit.userId,
          packageId: selectedPackage._id,
          packageNameSnapshot: selectedPackage.name,
          packageAmountSnapshot: capitalAmount,
          packageBenefitsSnapshot: selectedPackage.benefits,
          dailyReturnPercentageSnapshot: selectedPackage.dailyReturnPercentage,
          currency: selectedPackage.currency,
          userDisplayCurrency: deposit.userDisplayCurrency,
          exchangeRateSnapshot: deposit.exchangeRateSnapshot,
          capitalBalance: capitalAmount,
          profitBalance: 0,
          status: "active",
          activatedAt: new Date(),
          capitalWithdrawAvailableAt: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ),
        },
      ],
      { session },
    );

    const transaction = await InvestmentTransaction.create(
      [
        {
          userId: deposit.userId,
          investmentAccountId: account[0]._id,
          type: "package_activation",
          status: "successful",
          amount: capitalAmount,
          currency: selectedPackage.currency,
          balanceBefore: {
            capitalBalance: 0,
            profitBalance: 0,
          },
          balanceAfter: {
            capitalBalance: capitalAmount,
            profitBalance: 0,
          },
          reference,
          description: `${selectedPackage.name} AutoPilot Package activated`,
          metadata: {
            packageId: selectedPackage._id,
            packageNameSnapshot: selectedPackage.name,
            userDisplayCurrency: deposit.userDisplayCurrency,
            exchangeRateSnapshot: deposit.exchangeRateSnapshot,
          },
        },
      ],
      { session },
    );

    deposit.investmentAccountId = account[0]._id;
    deposit.transactionId = transaction[0]._id;
    deposit.providerTransactionId = verified.id ? String(verified.id) : null;
    deposit.status = "successful";
    deposit.verifiedAt = new Date();
    deposit.rawProviderResponse = verified;

    await deposit.save({ session });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "AutoPilot Package activated successfully",
      data: {
        account: account[0],
      },
    });
  } catch (error) {
    await session.abortTransaction();

    console.error(
      "AutoPilot Package payment verification error:",
      error.message,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to verify AutoPilot Package payment",
    });
  } finally {
    session.endSession();
  }
};

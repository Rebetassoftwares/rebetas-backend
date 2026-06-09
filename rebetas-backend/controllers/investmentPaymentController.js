const mongoose = require("mongoose");

const InvestmentPackage = require("../models/InvestmentPackage");
const InvestmentAccount = require("../models/InvestmentAccount");
const InvestmentDeposit = require("../models/InvestmentDeposit");
const InvestmentTransaction = require("../models/InvestmentTransaction");

const {
  initializeFlutterwavePayment,
  verifyFlutterwavePayment,
} = require("../services/payments/flutterwaveService");

const {
  initializePaystackPayment,
  verifyPaystackPayment,
} = require("../services/payments/paystackService");

const {
  getAdminExchangeRate,
} = require("../services/currencyConversionService");

const {
  sendAutoPilotNotification,
} = require("../services/notificationService");

function generateAutoPilotReference() {
  return "AP_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
}

const getUserId = (req) => req.user?._id || req.user?.id;

exports.initializeDeposit = async (req, res) => {
  try {
    const user = req.user;
    const userId = getUserId(req);

    const { packageId, provider = "flutterwave" } = req.body;
    const selectedProvider = String(provider).toLowerCase();

    if (!["flutterwave", "paystack"].includes(selectedProvider)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment provider",
      });
    }

    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: "AutoPilot Package selection is required",
      });
    }

    const localCurrency = String(user?.currency || "").toUpperCase();

    if (!localCurrency) {
      return res.status(400).json({
        success: false,
        message: "User currency is required for AutoPilot payment",
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

    const baseCurrency = String(
      selectedPackage.currency || "USD",
    ).toUpperCase();

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

    const pendingExpiryMinutes = 2;
    const pendingExpiryDate = new Date(
      Date.now() - pendingExpiryMinutes * 60 * 1000,
    );

    await InvestmentDeposit.updateMany(
      {
        userId,
        status: "pending",
        createdAt: { $lt: pendingExpiryDate },
      },
      {
        status: "failed",
      },
    );

    const existingPendingDeposit = await InvestmentDeposit.findOne({
      userId,
      status: { $in: ["pending", "processing"] },
      createdAt: { $gte: pendingExpiryDate },
    });

    if (existingPendingDeposit) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a pending AutoPilot Package payment. Please complete it or wait a few minutes to start again.",
        data: {
          provider: existingPendingDeposit.provider,
          reference: existingPendingDeposit.providerReference,
          paymentLink: existingPendingDeposit.paymentLink,
        },
      });
    }

    let exchangeRateSnapshot = 1;

    if (localCurrency !== baseCurrency) {
      exchangeRateSnapshot = await getAdminExchangeRate({
        baseCurrency,
        targetCurrency: localCurrency,
      });
    }

    const localizedAmount = Number(
      (Number(selectedPackage.amount) * Number(exchangeRateSnapshot)).toFixed(
        2,
      ),
    );

    const reference = generateAutoPilotReference();

    const deposit = await InvestmentDeposit.create({
      userId,
      packageId: selectedPackage._id,

      amount: localizedAmount,
      currency: localCurrency,

      baseAmount: selectedPackage.amount,
      baseCurrency,

      userDisplayCurrency: localCurrency,
      exchangeRateSnapshot,

      provider: selectedProvider,
      providerReference: reference,
      status: "pending",
    });

    let paymentData = null;

    if (selectedProvider === "flutterwave") {
      paymentData = await initializeFlutterwavePayment({
        email: user.email,
        amount: localizedAmount,
        currency: localCurrency,
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

          baseAmount: selectedPackage.amount,
          baseCurrency,

          localAmount: localizedAmount,
          localCurrency,

          exchangeRateSnapshot,
        },
      });
    }

    if (selectedProvider === "paystack") {
      paymentData = await initializePaystackPayment({
        email: user.email,
        amount: localizedAmount,
        currency: localCurrency,
        reference,
        callbackUrl: `${process.env.CLIENT_URL}/autopilot/payment/verify`,
      });
    }

    if (!paymentData) {
      deposit.status = "failed";
      await deposit.save();

      return res.status(500).json({
        success: false,
        message: "Unable to initialize AutoPilot Package payment",
      });
    }

    deposit.paymentLink =
      paymentData.link || paymentData.authorization_url || null;
    deposit.rawProviderResponse = paymentData;

    await deposit.save();

    await sendAutoPilotNotification({
      event: "PAYMENT_INITIALIZED",
      user,
      data: {
        amount: localizedAmount,
        currency: localCurrency,
      },
      metadata: {
        provider: selectedProvider,
        depositId: deposit._id,
        packageId: selectedPackage._id,
        packageName: selectedPackage.name,
        reference,
      },
    });

    return res.status(200).json({
      success: true,
      message: "AutoPilot Package payment initialized successfully",
      data: {
        provider: selectedProvider,
        reference,

        amount: localizedAmount,
        currency: localCurrency,

        baseAmount: selectedPackage.amount,
        baseCurrency,

        exchangeRateSnapshot,
        paymentLink: deposit.paymentLink,
      },
    });
  } catch (error) {
    console.error(
      "AutoPilot Package payment initialization error:",
      error.message,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to initialize AutoPilot Package payment",
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

    let verified = null;

    if (deposit.provider === "flutterwave") {
      verified = await verifyFlutterwavePayment(reference);
    }

    if (deposit.provider === "paystack") {
      verified = await verifyPaystackPayment(reference);
    }

    const verifiedStatus = String(verified?.status || "").toLowerCase();

    const isSuccessful =
      deposit.provider === "flutterwave"
        ? verifiedStatus === "successful"
        : verifiedStatus === "success";

    if (!verified || !isSuccessful) {
      deposit.status = "failed";
      deposit.rawProviderResponse = verified || {};

      await deposit.save({ session });
      await session.commitTransaction();

      return res.status(400).json({
        success: false,
        message: "AutoPilot Package payment verification failed",
      });
    }

    const verifiedAmount =
      deposit.provider === "paystack"
        ? Number(verified.amount || 0) / 100
        : Number(verified.amount || 0);

    if (verifiedAmount < Number(deposit.amount)) {
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

    const capitalAmount = Number(deposit.amount);
    const baseAmount = Number(deposit.baseAmount || selectedPackage.amount);
    const baseCurrency = String(deposit.baseCurrency || "USD").toUpperCase();
    const exchangeRateSnapshot = Number(deposit.exchangeRateSnapshot || 1);

    const account = await InvestmentAccount.create(
      [
        {
          userId: deposit.userId,
          packageId: selectedPackage._id,
          packageNameSnapshot: selectedPackage.name,

          packageAmountSnapshot: capitalAmount,

          basePackageAmountSnapshot: baseAmount,
          basePackageCurrencySnapshot: baseCurrency,

          packageBenefitsSnapshot: selectedPackage.benefits,

          dailyReturnPercentageSnapshot: selectedPackage.dailyReturnPercentage,

          currency: deposit.currency,
          userDisplayCurrency: deposit.userDisplayCurrency,
          exchangeRateSnapshot,

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
          currency: deposit.currency,

          baseAmount,
          baseCurrency,
          exchangeRateSnapshot,

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
            provider: deposit.provider,
            packageId: selectedPackage._id,
            packageNameSnapshot: selectedPackage.name,

            localAmount: capitalAmount,
            localCurrency: deposit.currency,
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

    await sendAutoPilotNotification({
      event: "PAYMENT_SUCCESSFUL",
      user: req.user,
      data: {
        amount: capitalAmount,
        currency: deposit.currency,
      },
      metadata: {
        provider: deposit.provider,
        depositId: deposit._id,
        transactionId: transaction[0]._id,
        reference,
      },
    });

    await sendAutoPilotNotification({
      event: "ACCOUNT_ACTIVATED",
      user: req.user,
      data: {
        amount: capitalAmount,
        currency: deposit.currency,
        packageName: selectedPackage.name,
      },
      metadata: {
        provider: deposit.provider,
        investmentAccountId: account[0]._id,
        packageId: selectedPackage._id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "AutoPilot Package activated successfully",
      data: {
        account: account[0],
      },
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

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

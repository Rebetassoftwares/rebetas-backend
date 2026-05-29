require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./database/connectDB");
const { startRoundScheduler } = require("./services/roundScheduler");
const { recoverPendingPayments } = require("./services/paymentRecoveryService");
const runSemiAuto = require("./services/semiAutoService");
const startCleanupScheduler = require("./services/cleanupScheduler");
const flutterwaveUnifiedWebhookRoutes = require("./routes/flutterwaveUnifiedWebhookRoutes");
const webhookRoutes = require("./routes/webhookRoutes");

const SystemState = require("./models/SystemState");

/*
ROUTES
*/
const platformRoutes = require("./routes/platformRoutes");
const predictionRoutes = require("./routes/predictionRoutes");
const historyRoutes = require("./routes/historyRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");

const adminPromoRoutes = require("./routes/adminPromoRoutes");
const adminPricingRoutes = require("./routes/adminPricingRoutes");

const paymentRoutes = require("./routes/paymentRoutes");
const paymentWebhookRoutes = require("./routes/paymentWebhookRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const adminUserRoutes = require("./routes/admin/userRoutes");
const adminSubscriptionRoutes = require("./routes/admin/subscriptionRoutes");
const adminPaymentRoutes = require("./routes/admin/paymentRoutes");
const adminAnalyticsRoutes = require("./routes/admin/analyticsRoutes");
const pricingRoutes = require("./routes/pricingRoutes");
const promoWithdrawalRoutes = require("./routes/promoWithdrawalRoutes");
const adminWithdrawalRoutes = require("./routes/adminWithdrawalRoutes");
const promoRoutes = require("./routes/promoRoutes");
const payoutDetailRoutes = require("./routes/payoutDetailRoutes");
const predictionSettingsRoutes = require("./routes/predictionSettingsRoutes");
const manualLeagueRoutes = require("./routes/manualLeagueRoutes");
const manualPredictionRoutes = require("./routes/manualPredictionRoutes");
const publicPredictionRoutes = require("./routes/publicPredictionRoutes");
const adminInvestmentPackageRoutes = require("./routes/adminInvestmentPackageRoutes");
const investmentRoutes = require("./routes/investmentRoutes");
const investmentPaymentRoutes = require("./routes/investmentPaymentRoutes");
const adminInvestmentWithdrawalRoutes = require("./routes/adminInvestmentWithdrawalRoutes");
const autoPilotFlutterwaveWebhookRoutes = require("./routes/autoPilotFlutterwaveWebhookRoutes");
const adminInvestmentDashboardRoutes = require("./routes/adminInvestmentDashboardRoutes");
const adminInvestmentTransactionRoutes = require("./routes/adminInvestmentTransactionRoutes");
const adminManualProfitRoutes = require("./routes/adminManualProfitRoutes");
const adminInvestmentAnalyticsRoutes = require("./routes/adminInvestmentAnalyticsRoutes");
const userNotificationRoutes = require("./routes/userNotificationRoutes");
const adminNotificationRoutes = require("./routes/adminNotificationRoutes");
const adminDailyProfitRoutes = require("./routes/adminDailyProfitRoutes");
const adminInvestmentAccountRoutes = require("./routes/adminInvestmentAccountRoutes");
const adminCurrencyRoutes = require("./routes/adminCurrencyRoutes");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173", // development
      "https://rebetas.com", // production
      "https://www.rebetas.com",
    ],
    credentials: true,
  }),
);

app.use("/api/flutterwave/webhook", express.raw({ type: "application/json" }));
app.use("/api/flutterwave/webhook", flutterwaveUnifiedWebhookRoutes);

/*
PAYMENT WEBHOOK ROUTE (RAW BODY REQUIRED)
*/
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use("/api/payments/webhook", paymentWebhookRoutes);

/*
🔥 NEW: FLUTTERWAVE TRANSFER WEBHOOK (RAW BODY REQUIRED)
*/
app.use("/api/webhooks/flutterwave", express.raw({ type: "application/json" }));
app.use("/api/webhooks/flutterwave", webhookRoutes);

/*
NORMAL JSON ROUTES
*/
app.use(express.json());
app.use("/uploads", express.static("uploads"));

/*
MAIN ROUTES
*/
app.use("/api/payments", paymentRoutes);
app.use("/api/admin/pricing", adminPricingRoutes);
app.use("/api/admin/promo", adminPromoRoutes);

app.use("/api/platforms", platformRoutes);
app.use("/api/prediction", predictionRoutes);
app.use("/api/history", historyRoutes);

app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/subscriptions", subscriptionRoutes);

app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/subscriptions", adminSubscriptionRoutes);
app.use("/api/admin/payments", adminPaymentRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/pricing", pricingRoutes);

app.use("/api/promo/withdrawals", promoWithdrawalRoutes);
app.use("/api/admin/withdrawals", adminWithdrawalRoutes);
app.use("/api/promo", promoRoutes);

app.use("/api/payout-details", payoutDetailRoutes);

app.use("/api/prediction-settings", predictionSettingsRoutes);
app.use("/api/manual-leagues", manualLeagueRoutes);
app.use("/api/manual-predictions", manualPredictionRoutes);
app.use("/api/public/predictions", publicPredictionRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/admin/investment-packages", adminInvestmentPackageRoutes);
app.use("/api/investments", investmentRoutes);
app.use("/api/investments", investmentPaymentRoutes);
app.use("/api/admin/autopilot-withdrawals", adminInvestmentWithdrawalRoutes);
app.use("/api/autopilot-webhooks", autoPilotFlutterwaveWebhookRoutes);
app.use("/api/admin/autopilot-dashboard", adminInvestmentDashboardRoutes);
app.use("/api/admin/autopilot-transactions", adminInvestmentTransactionRoutes);
app.use("/api/admin/autopilot-manual-profit", adminManualProfitRoutes);
app.use("/api/admin/autopilot-analytics", adminInvestmentAnalyticsRoutes);
app.use("/api/notifications", userNotificationRoutes);
app.use("/api/admin/notifications", adminNotificationRoutes);
app.use("/api/admin/autopilot-daily-profit", adminDailyProfitRoutes);
app.use("/api/admin/autopilot-accounts", adminInvestmentAccountRoutes);
app.use("/api/admin/currency-rates", adminCurrencyRoutes);

/*
HEALTH CHECK
*/
app.get("/", (req, res) => {
  res.json({
    message: "Rebetas backend is running",
  });
});

/*
SERVER IP CHECK
*/
app.get("/server-ip", async (req, res) => {
  try {
    const response = await fetch("https://api.ipify.org?format=json");

    const data = await response.json();

    res.json({
      success: true,
      ip: data.ip,
    });
  } catch (error) {
    console.error("Server IP fetch error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch server IP",
    });
  }
});

const PORT = process.env.PORT || 5000;
const seedDefaultPricing = require("./config/seedPricing");
/*
ENSURE SYSTEM STATE EXISTS
*/
async function ensureSystemState() {
  const existing = await SystemState.findOne({ key: "main" });

  if (!existing) {
    await SystemState.create({
      key: "main",
      capital: 500000,
      bettingSimulationActive: true,
      baseStakePercent: 0.2,
      multiplier: 7,
    });

    console.log("System state initialized");
  }
}

/*
START SERVER
*/
async function startServer() {
  await connectDB();
  await ensureSystemState();
  await seedDefaultPricing();

  console.log("ENV CHECK:", {
    mongo: !!process.env.MONGO_URI,
    jwt: !!process.env.JWT_SECRET,
  });

  app.listen(PORT, () => {
    console.log(`Rebetas server running on port ${PORT}`);

    //startRoundScheduler();
    //console.log("Round scheduler started");

    // Run every minute
    setInterval(() => {
      runSemiAuto();
    }, 60 * 1000);

    startCleanupScheduler();

    /*
    PAYMENT RECOVERY SERVICE
    */
    setInterval(
      () => {
        recoverPendingPayments();
      },
      20 * 60 * 1000,
    ); // every 20 minutes

    console.log("Payment recovery service started");
  });
}

startServer();

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./database/connectDB");
const { startRoundScheduler } = require("./services/roundScheduler");
const { recoverPendingPayments } = require("./services/paymentRecoveryService");
const runSemiAuto = require("./services/semiAutoService");
const startCleanupScheduler = require("./services/cleanupScheduler");

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

/*
PAYMENT WEBHOOK ROUTE (RAW BODY REQUIRED)
*/
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use("/api/payments/webhook", paymentWebhookRoutes);
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

app.use("/api/withdrawals", promoWithdrawalRoutes);
app.use("/api/admin/withdrawals", adminWithdrawalRoutes);
app.use("/api/promo", promoRoutes);

app.use("/api/payout-details", payoutDetailRoutes);

app.use("/api/prediction-settings", predictionSettingsRoutes);
app.use("/api/manual-leagues", manualLeagueRoutes);
app.use("/api/manual-predictions", manualPredictionRoutes);
app.use("/api/public/predictions", publicPredictionRoutes);

/*
HEALTH CHECK
*/
app.get("/", (req, res) => {
  res.json({
    message: "Rebetas backend is running",
  });
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

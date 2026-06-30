require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const connectDB = require("../database/connectDB");

const User = require("../models/User");
const InvestmentPackage = require("../models/InvestmentPackage");
const InvestmentAccount = require("../models/InvestmentAccount");
const InvestmentDeposit = require("../models/InvestmentDeposit");
const InvestmentTransaction = require("../models/InvestmentTransaction");

const {
  generateUniqueReferralCode,
  findReferrerByCode,
  createReferralRelationship,
} = require("../services/referralService");

const {
  getAdminExchangeRate,
} = require("../services/currencyConversionService");

const REFERRAL_CODE = "EMMANUEL830";
const DEFAULT_PASSWORD = "password123";

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function generateSeedReference(username) {
  return `SEED_AP_${username}_${Date.now()}_${Math.floor(
    Math.random() * 100000,
  )}`;
}

function pickRandomPackage(packages) {
  return packages[Math.floor(Math.random() * packages.length)];
}

async function getLocalAmountAndRate({
  baseAmount,
  baseCurrency,
  localCurrency,
}) {
  const base = String(baseCurrency || "USD").toUpperCase();
  const local = String(localCurrency || "USD").toUpperCase();

  if (base === local) {
    return {
      localAmount: roundMoney(baseAmount),
      exchangeRateSnapshot: 1,
    };
  }

  const exchangeRateSnapshot = await getAdminExchangeRate({
    baseCurrency: base,
    targetCurrency: local,
  });

  return {
    localAmount: roundMoney(Number(baseAmount) * Number(exchangeRateSnapshot)),
    exchangeRateSnapshot,
  };
}

const usersToCreate = [
  ["chukwudalu", "Chukwudalu Obi", "chukwudalu.obi@testmail.com"],
  ["temitopesamuel", "Temitope Samuel", "temitope.samuel@testmail.com"],
  ["onyedikachi", "Onyedikachi Eze", "onyedikachi.eze@testmail.com"],
  ["bukolaakande", "Bukola Akande", "bukola.akande@testmail.com"],
  ["godwinedet", "Godwin Edet", "godwin.edet@testmail.com"],
  ["preciousanu", "Precious Anu", "precious.anu@testmail.com"],
  ["mosesokoro", "Moses Okoro", "moses.okoro@testmail.com"],
  ["tochukwumadueke", "Tochukwu Madueke", "tochukwu.madueke@testmail.com"],
  ["abdulrahmanaliyu", "Abdulrahman Aliyu", "abdulrahman.aliyu@testmail.com"],
  ["joyibeh", "Joy Ibeh", "joy.ibeh@testmail.com"],
  ["festusogbonna", "Festus Ogbonna", "festus.ogbonna@testmail.com"],
  ["mercyekanem", "Mercy Ekanem", "mercy.ekanem@testmail.com"],
  ["josephatanda", "Joseph Atanda", "joseph.atanda@testmail.com"],
  ["chinenyemadu", "Chinenye Madu", "chinenye.madu@testmail.com"],
  ["olamideadeyemi", "Olamide Adeyemi", "olamide.adeyemi@testmail.com"],
  ["stanleynwankwo", "Stanley Nwankwo", "stanley.nwankwo@testmail.com"],
  ["fatimahassan", "Fatima Hassan", "fatima.hassan@testmail.com"],
  ["paschalokeke", "Paschal Okeke", "paschal.okeke@testmail.com"],
  ["roselineudo", "Roseline Udo", "roseline.udo@testmail.com"],
  ["segunajiboye", "Segun Ajiboye", "segun.ajiboye@testmail.com"],
  ["vivianibrahim", "Vivian Ibrahim", "vivian.ibrahim@testmail.com"],
  ["anthonyeze", "Anthony Eze", "anthony.eze@testmail.com"],
  ["oluchinwafrank", "Oluchinwa Frank", "oluchinwa.frank@testmail.com"],
  ["michaelomale", "Michael Omale", "michael.omale@testmail.com"],
  ["hadizabello", "Hadiza Bello", "hadiza.bello@testmail.com"],
  ["collinsugwu", "Collins Ugwu", "collins.ugwu@testmail.com"],
  ["janetudoh", "Janet Udoh", "janet.udoh@testmail.com"],
  ["emmanuelonah", "Emmanuel Onah", "emmanuel.onah@testmail.com"],
  ["deborahsalami", "Deborah Salami", "deborah.salami@testmail.com"],
  ["isaacokon", "Isaac Okon", "isaac.okon@testmail.com"],
  ["glorynnamdi", "Glory Nnamdi", "glory.nnamdi@testmail.com"],
].map(([username, fullName, email], index) => ({
  username,
  fullName,
  email,
  phone: `08020000${String(index + 1).padStart(3, "0")}`,
  country: "Nigeria",
  countryIsoCode: "NG",
  countryDialCode: "+234",
  currency: "NGN",
  password: DEFAULT_PASSWORD,
}));

async function seedAutopilotUsers() {
  await connectDB();

  const session = await mongoose.startSession();

  try {
    const packages = await InvestmentPackage.find({
      isActive: true,
    }).sort({ amount: 1 });

    if (!packages.length) {
      throw new Error("No active AutoPilot packages found");
    }

    const referrer = await findReferrerByCode(REFERRAL_CODE);

    if (!referrer) {
      throw new Error(`Referral code does not exist: ${REFERRAL_CODE}`);
    }

    console.log(
      `✅ Found ${packages.length} active AutoPilot packages. Random package assignment enabled.`,
    );

    for (const item of usersToCreate) {
      await session.withTransaction(async () => {
        const username = String(item.username).trim().toLowerCase();
        const email = String(item.email).trim().toLowerCase();
        const phone = String(item.phone).trim();
        const currency = String(item.currency || "USD").toUpperCase();

        const existingUser = await User.findOne({
          $or: [{ username }, { email }, { phone }],
        }).session(session);

        if (existingUser) {
          console.log(`⚠️ Skipped existing user: ${username}`);
          return;
        }

        const selectedPackage = pickRandomPackage(packages);

        const hashedPassword = await bcrypt.hash(item.password, 10);

        const newReferralCode = await generateUniqueReferralCode({
          username,
        });

        const user = await User.create(
          [
            {
              username,
              fullName: item.fullName,
              email,
              phone,

              country: item.country,
              countryIsoCode: item.countryIsoCode,
              countryDialCode: item.countryDialCode,
              currency,

              password: hashedPassword,

              emailVerified: true,
              emailVerificationToken: null,

              referralCode: newReferralCode,
              referredBy: referrer._id,

              referralBalance: 0,
              totalReferralEarned: 0,

              role: "user",
              accountStatus: "active",

              termsAccepted: true,
              termsAcceptedAt: new Date(),
            },
          ],
          { session },
        );

        await createReferralRelationship({
          referrerId: referrer._id,
          referredUserId: user[0]._id,
          referralCodeUsed: REFERRAL_CODE,
        });

        const baseAmount = Number(selectedPackage.amount);
        const baseCurrency = String(
          selectedPackage.currency || "USD",
        ).toUpperCase();

        const { localAmount, exchangeRateSnapshot } =
          await getLocalAmountAndRate({
            baseAmount,
            baseCurrency,
            localCurrency: currency,
          });

        const reference = generateSeedReference(username);

        const deposit = await InvestmentDeposit.create(
          [
            {
              userId: user[0]._id,
              packageId: selectedPackage._id,

              amount: localAmount,
              currency,

              baseAmount,
              baseCurrency,

              userDisplayCurrency: currency,
              exchangeRateSnapshot,

              provider: "paystack",
              providerReference: reference,
              providerTransactionId: reference,

              paymentLink: null,
              status: "successful",

              verifiedAt: new Date(),

              rawProviderResponse: {
                seeded: true,
                note: "Created by random-package seed script",
                reference,
              },
            },
          ],
          { session },
        );

        const account = await InvestmentAccount.create(
          [
            {
              userId: user[0]._id,
              packageId: selectedPackage._id,

              packageNameSnapshot: selectedPackage.name,
              packageAmountSnapshot: localAmount,

              basePackageAmountSnapshot: baseAmount,
              basePackageCurrencySnapshot: baseCurrency,

              packageBenefitsSnapshot: selectedPackage.benefits || [],
              dailyReturnPercentageSnapshot:
                selectedPackage.dailyReturnPercentage,

              currency,
              userDisplayCurrency: currency,
              exchangeRateSnapshot,

              capitalBalance: localAmount,
              profitBalance: 0,

              totalProfitEarned: 0,
              totalProfitWithdrawn: 0,
              totalCapitalWithdrawn: 0,

              status: "active",
              activatedAt: new Date(),

              lastProfitCreditedAt: null,
              lastReinvestDate: null,

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
              userId: user[0]._id,
              investmentAccountId: account[0]._id,

              type: "package_activation",
              status: "successful",

              amount: localAmount,
              currency,

              baseAmount,
              baseCurrency,
              exchangeRateSnapshot,

              balanceBefore: {
                capitalBalance: 0,
                profitBalance: 0,
              },

              balanceAfter: {
                capitalBalance: localAmount,
                profitBalance: 0,
              },

              reference,

              description: `${selectedPackage.name} AutoPilot Package activated by seed script`,

              metadata: {
                seeded: true,
                provider: "paystack",
                packageId: selectedPackage._id,
                packageNameSnapshot: selectedPackage.name,
                localAmount,
                localCurrency: currency,
                referralCodeUsed: REFERRAL_CODE,
              },
            },
          ],
          { session },
        );

        deposit[0].investmentAccountId = account[0]._id;
        deposit[0].transactionId = transaction[0]._id;

        await deposit[0].save({ session });

        console.log(
          `✅ ${item.fullName} created | ${username} | ${email} | package: ${selectedPackage.name} | password: ${item.password}`,
        );
      });
    }

    console.log("✅ Random AutoPilot users seeded successfully");
  } catch (error) {
    console.error("❌ Seed failed:", error);
  } finally {
    session.endSession();
    await mongoose.connection.close();
    process.exit(0);
  }
}

seedAutopilotUsers();

const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../models/User");
const { COUNTRIES } = require("../data/countries"); // adjust path if backend has countries elsewhere
const { generateUniqueReferralCode } = require("../services/referralService");

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to database");

    const users = await User.find({});

    let updated = 0;
    let skipped = 0;

    for (const user of users) {
      let changed = false;

      if (!user.referralCode) {
        user.referralCode = await generateUniqueReferralCode({
          username: user.username,
        });
        changed = true;
      }

      if (user.referralBalance === undefined || user.referralBalance === null) {
        user.referralBalance = 0;
        changed = true;
      }

      if (
        user.totalReferralEarned === undefined ||
        user.totalReferralEarned === null
      ) {
        user.totalReferralEarned = 0;
        changed = true;
      }

      const matchedCountry = COUNTRIES.find(
        (item) => normalize(item.name) === normalize(user.country),
      );

      if (matchedCountry) {
        if (!user.countryIsoCode) {
          user.countryIsoCode = matchedCountry.code;
          changed = true;
        }

        if (!user.countryDialCode) {
          user.countryDialCode = matchedCountry.dial;
          changed = true;
        }

        if (!user.currency) {
          user.currency = matchedCountry.currency;
          changed = true;
        }
      } else {
        console.log(
          `Country not matched for user ${user.email}: ${user.country}`,
        );
      }

      if (changed) {
        await user.save();
        updated += 1;
        console.log(`Updated ${user.email}`);
      } else {
        skipped += 1;
      }
    }

    console.log("Backfill completed");
    console.log("Updated:", updated);
    console.log("Skipped:", skipped);

    process.exit(0);
  } catch (error) {
    console.error("Backfill error:", error);
    process.exit(1);
  }
}

run();

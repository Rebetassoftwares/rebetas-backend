require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../database/connectDB");

const User = require("../models/User");
const InvestmentAccount = require("../models/InvestmentAccount");

const NEW_CAPITAL_BALANCE = 2200000;

const TARGET_EMAILS = [
  "ifeanyi.echie@testmail.com",
  "chinenye.udo@testmail.com",
  "oluwasegun.adebayo@testmail.com",
  "nnenna.eze@testmail.com",
  "emeka.nwosu@testmail.com",
  "halima.musa@testmail.com",
  "taiwo.ogunleye@testmail.com",
  "blessing.okon@testmail.com",
  "kelechi.obi@testmail.com",
  "abdulkareem.yusuf@testmail.com",
  "ngozi.akpan@testmail.com",
  "solomon.idowu@testmail.com",
  "chioma.umeh@testmail.com",
  "ibrahim.sani@testmail.com",
  "esther.oladipo@testmail.com",
  "martins.okafor@testmail.com",
  "zainab.danjuma@testmail.com",
  "samuel.onuoha@testmail.com",
  "patience.egwu@testmail.com",
  "olumide.awoniyi@testmail.com",

  "kingsley.ken@testmail.com",
  "chime.abua@testmail.com",
  "dodo.jones@testmail.com",
  "mary.athor@testmail.com",
  "amina.kay@testmail.com",
  "duke.silver@testmail.com",
  "pope.john@testmail.com",
  "adams.king@testmail.com",
  "amara.okeke@testmail.com",
  "ebuka.nnaji@testmail.com",
  "chris.jones@testmail.com",
  "alhaji.tom@testmail.com",
  "uche.johnson@testmail.com",
  "fadekemi.ade@testmail.com",
  "victor.osaze@testmail.com",
  "sarah.musa@testmail.com",
  "daniel.bassey@testmail.com",
  "grace.adamu@testmail.com",
  "tony.blake@testmail.com",
  "ruth.daniels@testmail.com",
];

async function updateOnlySeededCapitalBalances() {
  await connectDB();

  try {
    const users = await User.find({
      email: { $in: TARGET_EMAILS },
    }).select("_id username fullName email");

    console.log(
      `Found ${users.length} of ${TARGET_EMAILS.length} target users.`,
    );

    let updatedCount = 0;

    for (const user of users) {
      const account = await InvestmentAccount.findOne({
        userId: user._id,
        status: "active",
      });

      if (!account) {
        console.log(`⚠️ No active AutoPilot account found for ${user.email}`);
        continue;
      }

      const oldCapital = account.capitalBalance;

      account.capitalBalance = NEW_CAPITAL_BALANCE;

      await account.save();

      updatedCount += 1;

      console.log(`✅ ${user.email}: ${oldCapital} → ${NEW_CAPITAL_BALANCE}`);
    }

    console.log(`✅ Done. Updated ${updatedCount} accounts only.`);
  } catch (error) {
    console.error("❌ Update failed:", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

updateOnlySeededCapitalBalances();

const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../models/User");
const InvestmentAccount = require("../models/InvestmentAccount");
const { sendEmail } = require("../services/emailService");

function autopilotServiceUpdateTemplate(fullName) {
  const year = new Date().getFullYear();

  return `
  <div style="
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f4f6fb;
    padding: 40px 20px;
  ">
    <div style="
      max-width: 540px;
      margin: auto;
      background: #ffffff;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 12px 35px rgba(0,0,0,0.08);
    ">

      <div style="
        background: linear-gradient(135deg, #6c2bd9, #a855f7);
        padding: 30px;
        text-align: center;
        color: white;
      ">
        <h1 style="margin: 0; font-size: 26px;">Rebetas</h1>
        <p style="margin: 8px 0 0; font-size: 14px;">
          AI-Powered Virtual Football Predictions
        </p>
      </div>

      <div style="padding: 35px; color: #333;">
        <h2 style="margin-top: 0; text-align: center;">
          Important AutoPilot Service Update ⚙️
        </h2>

        <p style="font-size: 15px; color: #555;">
          Hello ${fullName || "Valued User"},
        </p>

        <p style="font-size: 15px; color: #555; line-height: 1.7;">
          We noticed a temporary network instability affecting some African
          banking channels and payment-related operations on Rebetas AutoPilot.
        </p>

        <p style="font-size: 15px; color: #555; line-height: 1.7;">
          To protect user balances and prevent possible transaction errors,
          we are adding an extra layer of security checks to the AutoPilot system.
        </p>

        <div style="
          margin: 25px 0;
          padding: 20px;
          background: #f3e8ff;
          border-left: 5px solid #6c2bd9;
          border-radius: 10px;
        ">
          <p style="margin: 0 0 8px; font-size: 15px;">
            <b>Expected Restoration Time:</b>
          </p>
          <p style="margin: 0; font-size: 15px; color: #6c2bd9;">
            Within <b>3 days</b>
          </p>
        </div>

        <p style="font-size: 15px; color: #555; line-height: 1.7;">
          During this period, some AutoPilot accounts may receive daily profit
          credit normally, while some accounts may experience temporary delays
          in daily profit credit.
        </p>

        <p style="font-size: 15px; color: #555; line-height: 1.7;">
          Please be assured that this is a protective update, and our team is
          working to fully restore normal service within the stated timeframe.
        </p>

        <p style="font-size: 15px; color: #555;">
          We sincerely apologize for any inconvenience and appreciate your patience.
        </p>

        <p style="font-size: 15px; color: #333; margin-bottom: 0;">
          Best regards,<br />
          <b>The Rebetas Team</b>
        </p>
      </div>

      <div style="
        background: #fafafa;
        padding: 18px;
        text-align: center;
        font-size: 12px;
        color: #999;
      ">
        © ${year} Rebetas. All rights reserved.
      </div>

    </div>
  </div>
  `;
}

async function sendAutopilotServiceUpdate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ Connected to database");

    const accounts = await InvestmentAccount.find({
      status: "active",
    }).select("userId");

    const userIds = [
      ...new Set(accounts.map((account) => String(account.userId))),
    ];

    console.log(`👤 Found ${userIds.length} active AutoPilot account users`);

    const users = await User.find({
      _id: { $in: userIds },
      emailVerified: true,
      email: { $exists: true, $ne: "" },
    }).select("email fullName");

    console.log(`📧 Found ${users.length} verified AutoPilot users`);

    for (const user of users) {
      await sendEmail({
        to: user.email,
        subject: "⚙️ Important AutoPilot Service Update",
        html: autopilotServiceUpdateTemplate(user.fullName),
      });

      console.log(`✅ Sent AutoPilot update email to ${user.email}`);
    }

    console.log("🎉 AutoPilot service update sent successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ AutoPilot service update script error:", error);
    process.exit(1);
  }
}

sendAutopilotServiceUpdate();

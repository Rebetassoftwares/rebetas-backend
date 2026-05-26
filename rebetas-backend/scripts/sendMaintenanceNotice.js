const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../models/User");
const { sendEmail } = require("../services/emailService");

function maintenanceEmailTemplate(fullName) {
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
          Scheduled Maintenance Notice ⚙️
        </h2>

        <p style="font-size: 15px; color: #555;">
          Hello ${fullName || "Valued User"},
        </p>

        <p style="font-size: 15px; color: #555; line-height: 1.7;">
          We are carrying out an important Rebetas system update to improve
          performance, stability, and your overall experience.
        </p>

        <div style="
          margin: 25px 0;
          padding: 20px;
          background: #f3e8ff;
          border-left: 5px solid #6c2bd9;
          border-radius: 10px;
        ">
          <p style="margin: 0 0 8px; font-size: 15px;">
            <b>Service Downtime:</b>
          </p>
          <p style="margin: 0; font-size: 15px; color: #6c2bd9;">
            From <b>5:00 AM today 26th may </b> to <b>5:00 AM tomorrow 27th may 2026</b>
          </p>
        </div>

        <p style="font-size: 15px; color: #555; line-height: 1.7;">
          During this period, Rebetas services may be temporarily unavailable.
          We sincerely apologize for any inconvenience and appreciate your
          patience while we complete the update.
        </p>

        <p style="font-size: 15px; color: #555;">
          Thank you for being part of Rebetas.
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

async function sendMaintenanceNotice() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ Connected to database");

    const users = await User.find({
      emailVerified: true,
      email: { $exists: true, $ne: "" },
    }).select("email fullName");

    console.log(`📧 Found ${users.length} verified users`);

    for (const user of users) {
      await sendEmail({
        to: user.email,
        subject: "⚙️ Scheduled Rebetas Maintenance Notice",
        html: maintenanceEmailTemplate(user.fullName),
      });

      console.log(`✅ Sent maintenance email to ${user.email}`);
    }

    console.log("🎉 Maintenance notice sent to all verified users");
    process.exit(0);
  } catch (error) {
    console.error("❌ Maintenance email script error:", error);
    process.exit(1);
  }
}

sendMaintenanceNotice();

const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../models/User");
const { sendEmail } = require("../services/emailService");

function autopilotEmailTemplate(fullName) {
  const year = new Date().getFullYear();

  return `
  <div style="
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f4f6fb;
    padding: 40px 20px;
  ">
    <div style="
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 12px 35px rgba(0,0,0,0.08);
    ">

      <div style="
        background: linear-gradient(135deg, #6c2bd9, #a855f7);
        padding: 40px 30px;
        text-align: center;
        color: white;
      ">
        <h1 style="margin: 0; font-size: 32px; font-weight: 800;">
          Rebetas Autopilot 🚀
        </h1>
        <p style="margin-top: 10px; font-size: 15px; opacity: 0.95;">
          Smarter Earnings, Less Stress
        </p>
      </div>

      <div style="padding: 40px 35px; color: #333;">
        <p style="font-size: 16px;">Dear ${fullName || "Valued Rebetas User"},</p>

        <p style="font-size: 16px; line-height: 1.8;">
          Something powerful is coming to Rebetas.
        </p>

        <p style="font-size: 16px; line-height: 1.8;">
          Over the past months, we’ve carefully listened to your feedback,
          studied user behavior, and worked tirelessly on building a smarter
          experience designed to help our users earn more consistently with
          less stress and reduced risk.
        </p>

        <p style="font-size: 16px; line-height: 1.8;">
          Today, we’re excited to introduce:
        </p>

        <h2 style="
          color: #6c2bd9;
          font-size: 28px;
          margin: 25px 0;
          text-align: center;
        ">
          🚀 Rebetas Autopilot
        </h2>

        <h3 style="font-size: 20px; color: #222;">
          So, what exactly is Autopilot?
        </h3>

        <p style="font-size: 16px; line-height: 1.8;">
          Autopilot is a new Rebetas feature that allows Rebetas do the
          betting for users while users enjoy their daily profits.
        </p>

        <p style="font-size: 16px; line-height: 1.8;">
          This means users do not need to stress themselves checking games all
          day or placing bets manually.
        </p>

        <div style="
          background: #f3e8ff;
          border-left: 5px solid #6c2bd9;
          border-radius: 14px;
          padding: 24px;
          margin: 30px 0;
        ">
          <p style="margin-top: 0; font-weight: 700;">
            This means:
          </p>

          <p>✅ Less emotional decision-making</p>
          <p>✅ Less stress and manual monitoring</p>
          <p>✅ Smarter AI-assisted betting flow</p>
          <p>✅ Better consistency and optimized execution</p>
          <p>✅ Reduced unnecessary risk exposure</p>
          <p>✅ A smoother and more efficient earning experience</p>
          <p>✅ Rebetas handles the betting while users enjoy daily profits</p>
        </div>

        <p style="font-size: 16px; line-height: 1.8;">
          Autopilot represents a major evolution of the Rebetas platform.
        </p>

        <p style="font-size: 16px; line-height: 1.8;">
          Instead of users struggling to keep up manually, the platform is being
          upgraded to provide a more intelligent, streamlined, and user-focused
          experience built around smarter earning and long-term sustainability.
        </p>

        <p style="font-size: 16px; line-height: 1.8;">
          We truly appreciate your patience, trust, and continued support.
        </p>

        <p style="font-size: 16px; line-height: 1.8;">
          We’ll be back shortly — stronger, smarter, and better optimized to
          help you win.
        </p>

        <p style="font-size: 16px; margin-top: 30px;">
          Warm regards,<br />
          <b>The Rebetas Team</b>
        </p>
      </div>

      <div style="
        background: #fafafa;
        padding: 20px;
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

async function sendAutopilotAnnouncement() {
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
        subject:
          "🚀 Introducing Rebetas Autopilot — Smarter Earnings, Less Stress",
        html: autopilotEmailTemplate(user.fullName),
      });

      console.log(`✅ Sent Autopilot email to ${user.email}`);

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    console.log("🎉 Autopilot announcement sent to all verified users");
    process.exit(0);
  } catch (error) {
    console.error("❌ Autopilot email script error:", error);
    process.exit(1);
  }
}

sendAutopilotAnnouncement();

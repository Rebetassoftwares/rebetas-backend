const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../models/User");
const { sendEmail } = require("../services/emailService");

function maintenanceExtensionTemplate(fullName) {
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

        <p style="
          margin: 8px 0 0;
          font-size: 14px;
          opacity: 0.95;
        ">
          AI-Powered Virtual Football Predictions
        </p>
      </div>

      <div style="padding: 35px; color: #333;">

        <h2 style="
          margin-top: 0;
          text-align: center;
          font-size: 24px;
          color: #222;
        ">
          Important Service Update ⚙️
        </h2>

        <p style="
          font-size: 15px;
          color: #555;
          line-height: 1.7;
        ">
          Hello ${fullName || "Valued User"},
        </p>

        <p style="
          font-size: 15px;
          color: #555;
          line-height: 1.8;
        ">
          We sincerely appreciate your patience and continued support during our
          ongoing Rebetas system upgrade.
        </p>

        <p style="
          font-size: 15px;
          color: #555;
          line-height: 1.8;
        ">
          Our engineers and technical team have been working tirelessly around
          the clock to ensure that all Rebetas services return fully stable,
          smoother, faster, and even better than before.
        </p>

        <p style="
          font-size: 15px;
          color: #555;
          line-height: 1.8;
        ">
          Due to the scale of improvements currently being implemented, the
          maintenance process is taking slightly longer than earlier expected.
        </p>

        <div style="
          margin: 28px 0;
          padding: 22px;
          background: #f3e8ff;
          border-left: 5px solid #6c2bd9;
          border-radius: 10px;
        ">
          <p style="
            margin: 0 0 10px;
            font-size: 15px;
            color: #333;
          ">
            <b>Updated Service Restoration Time:</b>
          </p>

          <p style="
            margin: 0;
            font-size: 16px;
            color: #6c2bd9;
            line-height: 1.7;
            font-weight: 600;
          ">
            Rebetas services are expected to be fully restored by the early
            morning of <b>28th May 2026</b>.
          </p>
        </div>

        <p style="
          font-size: 15px;
          color: #555;
          line-height: 1.8;
        ">
          We understand the inconvenience this temporary downtime may cause,
          and we deeply appreciate your understanding while we complete these
          important upgrades focused on delivering a better overall experience
          for the entire Rebetas community.
        </p>

        <p style="
          font-size: 15px;
          color: #555;
          line-height: 1.8;
        ">
          Thank you for standing with Rebetas.
        </p>

        <p style="
          font-size: 15px;
          color: #333;
          margin-bottom: 0;
          line-height: 1.7;
        ">
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

async function sendMaintenanceExtensionNotice() {
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
        subject: "⚙️ Important Rebetas Service Update",
        html: maintenanceExtensionTemplate(user.fullName),
      });

      console.log(`✅ Sent update email to ${user.email}`);
    }

    console.log("🎉 Maintenance update sent to all verified users");

    process.exit(0);
  } catch (error) {
    console.error("❌ Maintenance update script error:", error);
    process.exit(1);
  }
}

sendMaintenanceExtensionNotice();

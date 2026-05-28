const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../models/User");
const { sendEmail } = require("../services/emailService");

function servicesRestoredAutoPilotTemplate(fullName) {
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
          Rebetas Services Are Back 🚀
        </h2>

        <p style="font-size: 15px; color: #555;">
          Hello ${fullName || "Valued User"},
        </p>

        <p style="font-size: 15px; color: #555; line-height: 1.7;">
          We are happy to let you know that Rebetas services are now back.
        </p>

        <p style="font-size: 15px; color: #555; line-height: 1.7;">
          Our team worked carefully to restore the system, improve performance,
          and make the Rebetas experience better for everyone.
        </p>

        <div style="
          margin: 25px 0;
          padding: 20px;
          background: #f3e8ff;
          border-left: 5px solid #6c2bd9;
          border-radius: 10px;
        ">
          <p style="margin: 0 0 8px; font-size: 15px;">
            <b>New Feature:</b>
          </p>
          <p style="margin: 0; font-size: 15px; color: #6c2bd9;">
            <b>Rebetas AutoPilot is now live as part of our 4th year anniversary.</b>
          </p>
        </div>

        <p style="font-size: 15px; color: #555; line-height: 1.7;">
          AutoPilot allows you to activate a package while Rebetas handles the
          daily activity for you. You can monitor your profit from your dashboard,
          withdraw your profit, or compound your profit to grow your active capital.
        </p>

        <div style="
          margin: 25px 0;
          padding: 20px;
          background: #faf7ff;
          border: 1px solid #eadcff;
          border-radius: 12px;
        ">
          <p style="margin: 0 0 12px; font-size: 15px; color: #333;">
            <b>With AutoPilot, you can:</b>
          </p>

          <ul style="
            margin: 0;
            padding-left: 20px;
            color: #555;
            font-size: 15px;
            line-height: 1.8;
          ">
            <li>Get daily profit updates</li>
            <li>Withdraw profit anytime</li>
            <li>Compound profit anytime</li>
            <li>Monitor everything from your dashboard</li>
            <li>Allow Rebetas to handle the daily activity</li>
          </ul>
        </div>

        <p style="font-size: 15px; color: #555; line-height: 1.7;">
          You can log in now to access your account and explore AutoPilot.
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <a
            href="https://rebetas.com/login"
            style="
              display: inline-block;
              background: linear-gradient(135deg, #6c2bd9, #a855f7);
              color: #ffffff;
              text-decoration: none;
              padding: 14px 26px;
              border-radius: 10px;
              font-size: 15px;
              font-weight: bold;
            "
          >
            Login to Rebetas
          </a>
        </div>

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
        © ${year} Rebetas. All rights reserved.<br />
        1900 Camden Ave, San Jose, CA 95124
      </div>

    </div>
  </div>
  `;
}

async function sendServicesRestoredAutoPilotEmail() {
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
        subject: "🚀 Rebetas Services Are Back — AutoPilot Is Now Live",
        html: servicesRestoredAutoPilotTemplate(user.fullName),
      });

      console.log(`✅ Sent service restored email to ${user.email}`);
    }

    console.log(
      "🎉 Service restored and AutoPilot email sent to all verified users",
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Service restored email script error:", error);
    process.exit(1);
  }
}

sendServicesRestoredAutoPilotEmail();

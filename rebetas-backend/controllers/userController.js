const bcrypt = require("bcrypt");
const crypto = require("crypto");

const User = require("../models/User");
const PromoCode = require("../models/PromoCode");
const { sendEmail } = require("../services/emailService");

function generateToken(size = 32) {
  return crypto.randomBytes(size).toString("hex");
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
}
/*
REGISTER USER
*/
/*
REGISTER USER
*/
async function registerUser(req, res) {
  try {
    const {
      username,
      fullName,
      email,
      phone,
      country,
      password,
      confirmPassword,
      promoCode,
      acceptedTerms,
    } = req.body;

    if (
      !username ||
      !fullName ||
      !email ||
      !phone ||
      !country ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message:
          "username, fullName, email, phone, country and password are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    const normalizedUsername = String(username).trim().toLowerCase();
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPhone = String(phone).trim();

    const existingUser = await User.findOne({
      $or: [
        { username: normalizedUsername },
        { email: normalizedEmail },
        { phone: normalizedPhone },
      ],
    });

    if (existingUser) {
      if (existingUser.username === normalizedUsername) {
        return res.status(409).json({
          message: "Username already exists",
        });
      }

      if (existingUser.email === normalizedEmail) {
        return res.status(409).json({
          message: "Email already exists",
        });
      }

      if (existingUser.phone === normalizedPhone) {
        return res.status(409).json({
          message: "Phone number already exists",
        });
      }
    }

    /*
    PROMO CODE VALIDATION
    */
    let promoCodeUsed = null;
    let trialEndsAt = null;

    if (promoCode) {
      const promo = await PromoCode.findOne({
        code: promoCode.toUpperCase(),
        active: true,
      });

      if (!promo) {
        return res.status(400).json({
          message: "Invalid promo code",
        });
      }

      // ✅ CHECK GLOBAL MAX USERS
      if (promo.maxUsers && promo.usageCount >= promo.maxUsers) {
        return res.status(400).json({
          message: "Promo code usage limit reached",
        });
      }

      promoCodeUsed = promo.code;

      // ✅ APPLY TRIAL (ONLY IF AVAILABLE)
      if (promo.trialDays && promo.trialDays > 0) {
        trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + promo.trialDays);
      }

      // ✅ INCREMENT GLOBAL USAGE
      promo.usageCount += 1;
      await promo.save();
    }

    if (!acceptedTerms) {
      return res.status(400).json({
        message: "You must accept Terms & Conditions",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = generateToken(24);

    const user = await User.create({
      username: normalizedUsername,
      fullName,
      email: normalizedEmail,
      phone: normalizedPhone,
      country,
      password: hashedPassword,
      emailVerificationToken: verificationToken,
      promoCodeUsed,
      trialEndsAt,
      hasUsedTrial: !!trialEndsAt,

      // 🔥 ADD THIS
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    });

    /*
    SEND EMAIL (SAFE - WILL NOT BREAK REGISTRATION)
    */
    try {
      const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

      await sendEmail({
        to: user.email,
        subject: "🚀 Verify Your Rebetas Account",
        html: `
  <div style="
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f4f6fb;
    padding: 40px 20px;
  ">

    <div style="
      max-width: 520px;
      margin: auto;
      background: #ffffff;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 12px 35px rgba(0,0,0,0.08);
    ">

      <!-- HEADER -->
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

      <!-- BODY -->
      <div style="padding: 35px; text-align: center; color: #333;">

        <h2 style="margin-bottom: 10px;">
          Welcome ${user.fullName} 🎉
        </h2>

        <p style="color: #666; font-size: 15px;">
          You're one step away from unlocking smarter betting with
          <b>AI-powered predictions</b>.
        </p>

        <p style="margin-top: 20px; font-size: 15px;">
          Please verify your email address to activate your account:
        </p>

        <!-- BUTTON -->
        <a href="${verifyUrl}" style="
          display: inline-block;
          margin-top: 25px;
          padding: 14px 28px;
          background: linear-gradient(135deg, #6c2bd9, #a855f7);
          color: #ffffff;
          text-decoration: none;
          font-weight: 600;
          border-radius: 8px;
          font-size: 15px;
          box-shadow: 0 5px 15px rgba(108, 43, 217, 0.3);
        ">
          ✅ Verify My Account
        </a>

        <p style="margin-top: 25px; font-size: 13px; color: #999;">
          If the button doesn't work, copy and paste this link:
        </p>

        <p style="
          word-break: break-all;
          font-size: 12px;
          color: #6c2bd9;
        ">
          ${verifyUrl}
        </p>

      </div>

      <!-- FOOTER -->
      <div style="
        background: #fafafa;
        padding: 18px;
        text-align: center;
        font-size: 12px;
        color: #999;
      ">
        © ${new Date().getFullYear()} Rebetas. All rights reserved.
      </div>

    </div>
  </div>
  `,
      });
    } catch (emailError) {
      console.error("EMAIL FULL ERROR:", emailError);
    }

    /*
    FINAL RESPONSE (ALWAYS SUCCESS IF USER CREATED)
    */
    res.status(201).json({
      message: "Registration successful. Please verify your email.",
    });
  } catch (error) {
    console.error("Register error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
}

/*
VERIFY EMAIL
*/
async function verifyEmail(req, res) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        message: "Verification token required",
      });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid verification token",
      });
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;

    await user.save();

    res.json({
      message: "Email verified successfully. You can now login.",
    });
  } catch (error) {
    console.error("Verify email error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
}

/*
LOGIN USER
*/
async function loginUser(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password required",
      });
    }

    const normalizedUsername = String(username).toLowerCase();

    const user = await User.findOne({
      username: normalizedUsername,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email before login",
      });
    }

    // ✅ PRESERVE ONE-DEVICE-ONE-ACCOUNT RULE
    // ✅ DEVICE CHECK
    const { deviceToken } = req.body;

    // SAME DEVICE → DIRECT LOGIN (NO OTP)
    if (user.activeDeviceToken && user.activeDeviceToken === deviceToken) {
      return res.json({
        message: "Login successful",
        token: user.activeDeviceToken,
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          country: user.country,
          role: user.role,
        },
      });
    }

    // NEW DEVICE → REQUIRE OTP (continue below)

    // ✅ GENERATE OTP
    const otp = generateOtp();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    user.loginOtp = otp;
    user.loginOtpExpires = expiry;

    await user.save();

    // ✅ SEND EMAIL
    try {
      console.log("📧 LOGIN EMAIL ATTEMPT TO:", user.email);

      await sendEmail({
        to: user.email,
        subject: "🔐 Your Rebetas Login Code",
        html: `
  <div style="
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f4f6fb;
    padding: 40px 20px;
  ">
    <div style="
      max-width: 500px;
      margin: auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    ">

      <!-- HEADER -->
      <div style="
        background: linear-gradient(135deg, #6c2bd9, #a855f7);
        padding: 25px;
        text-align: center;
        color: white;
      ">
        <h1 style="margin: 0; font-size: 24px;">Rebetas</h1>
        <p style="margin: 5px 0 0;">Secure Login Verification</p>
      </div>

      <!-- BODY -->
      <div style="padding: 30px; text-align: center; color: #333;">

        <h2 style="margin-bottom: 10px;">Hello ${user.fullName}, 👋</h2>

        <p style="color: #666; font-size: 15px;">
          We received a login request to your Rebetas account.
        </p>

        <p style="margin-top: 20px; font-size: 16px;">
          Use the verification code below to continue:
        </p>

        <!-- OTP BOX -->
        <div style="
          margin: 30px auto;
          padding: 20px;
          background: #f3e8ff;
          border-radius: 10px;
          display: inline-block;
        ">
          <span style="
            font-size: 34px;
            letter-spacing: 8px;
            font-weight: bold;
            color: #6c2bd9;
          ">
            ${otp}
          </span>
        </div>

        <p style="color: #999; font-size: 14px;">
          ⏳ This code will expire in <b>5 minutes</b>.
        </p>

        <p style="margin-top: 25px; font-size: 14px; color: #666;">
          If you did not request this login, please ignore this email or secure your account.
        </p>

      </div>

      <!-- FOOTER -->
      <div style="
        background: #fafafa;
        padding: 15px;
        text-align: center;
        font-size: 12px;
        color: #999;
      ">
        © ${new Date().getFullYear()} Rebetas. All rights reserved.
      </div>

    </div>
  </div>
  `,
      });
    } catch (err) {
      console.error("❌ FULL LOGIN EMAIL ERROR:");
      console.error(err);
    }

    return res.json({
      message: "OTP sent to your email",
      requireOtp: true,
      userId: user._id,
      email: user.email,
    });
  } catch (error) {
    console.error("Login error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
}

async function verifyLoginOtp(req, res) {
  try {
    const { userId, otp, deviceToken } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        message: "OTP and userId required",
      });
    }

    const user = await User.findById(userId);

    if (!user || !user.loginOtp) {
      return res.status(400).json({
        message: "Invalid request",
      });
    }

    if (user.loginOtp !== otp) {
      return res.status(401).json({
        message: "Invalid OTP",
      });
    }

    if (user.loginOtpExpires < new Date()) {
      return res.status(401).json({
        message: "OTP expired",
      });
    }

    // ✅ CLEAR OTP
    user.loginOtp = null;
    user.loginOtpExpires = null;

    // ✅ CREATE SESSION TOKEN
    // 🔥 USE REAL DEVICE TOKEN FROM FRONTEND
    user.activeDeviceToken = deviceToken;

    await user.save();

    res.json({
      message: "Login successful",
      token: deviceToken,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        country: user.country,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("OTP verify error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
}

async function resendLoginOtp(req, res) {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const otp = generateOtp();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    user.loginOtp = otp;
    user.loginOtpExpires = expiry;

    await user.save();

    await sendEmail({
      to: user.email,
      subject: "🔁 Your New Rebetas Login Code",
      html: `
  <div style="
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f4f6fb;
    padding: 40px 20px;
  ">
    <div style="
      max-width: 500px;
      margin: auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    ">

      <!-- HEADER -->
      <div style="
        background: linear-gradient(135deg, #6c2bd9, #a855f7);
        padding: 25px;
        text-align: center;
        color: white;
      ">
        <h1 style="margin: 0; font-size: 24px;">Rebetas</h1>
        <p style="margin: 5px 0 0;">New Login Code Requested</p>
      </div>

      <!-- BODY -->
      <div style="padding: 30px; text-align: center; color: #333;">

        <h2 style="margin-bottom: 10px;">Hello ${user.fullName}, 👋</h2>

        <p style="color: #666; font-size: 15px;">
          You requested a new login verification code.
        </p>

        <p style="margin-top: 15px; font-size: 15px;">
          Use the new code below to continue your login:
        </p>

        <!-- OTP BOX -->
        <div style="
          margin: 30px auto;
          padding: 20px;
          background: #f3e8ff;
          border-radius: 10px;
          display: inline-block;
        ">
          <span style="
            font-size: 34px;
            letter-spacing: 8px;
            font-weight: bold;
            color: #6c2bd9;
          ">
            ${otp}
          </span>
        </div>

        <p style="color: #999; font-size: 14px;">
          ⏳ This new code will expire in <b>5 minutes</b>.
        </p>

        <p style="margin-top: 20px; font-size: 14px; color: #666;">
          ⚠️ Any previous code has now been invalidated.
        </p>

        <p style="margin-top: 15px; font-size: 14px; color: #666;">
          If you did not request this, please ignore this email or secure your account.
        </p>

      </div>

      <!-- FOOTER -->
      <div style="
        background: #fafafa;
        padding: 15px;
        text-align: center;
        font-size: 12px;
        color: #999;
      ">
        © ${new Date().getFullYear()} Rebetas. All rights reserved.
      </div>

    </div>
  </div>
  `,
    });

    res.json({
      message: "OTP resent successfully",
    });
  } catch (error) {
    console.error("Resend OTP error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
}
/*
LOGOUT USER
*/
async function logoutUser(req, res) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const user = await User.findOne({
      activeDeviceToken: token,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid session",
      });
    }

    user.activeDeviceToken = null;

    await user.save();

    res.json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
}

module.exports = {
  registerUser,
  verifyEmail,
  loginUser,
  verifyLoginOtp,
  resendLoginOtp,
  logoutUser,
};

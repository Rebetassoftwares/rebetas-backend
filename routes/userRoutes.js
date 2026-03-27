const express = require("express");
const router = express.Router();

const {
  registerUser,
  verifyEmail,
  loginUser,
  verifyLoginOtp, // ✅ added
  resendLoginOtp, // ✅ added
  logoutUser,
} = require("../controllers/userController");

// 🔐 AUTH FLOW

// Register
router.post("/register", registerUser);

// Verify email (from email link)
router.get("/verify-email", verifyEmail);

// Login (returns OTP step)
router.post("/login", loginUser);

// Verify OTP (completes login)
router.post("/verify-login-otp", verifyLoginOtp);

// Resend OTP
router.post("/resend-login-otp", resendLoginOtp);

// Logout
router.post("/logout", logoutUser);

module.exports = router;

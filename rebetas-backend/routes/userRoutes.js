const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authenticateUser");

const {
  registerUser,
  verifyEmail,
  loginUser,
  verifyLoginOtp,
  resendLoginOtp,
  logoutUser,
  getMyReferral,
} = require("../controllers/userController");

// 🔐 AUTH FLOW

// Register
router.post("/register", registerUser);

// Verify email
router.get("/verify-email", verifyEmail);

// Login
router.post("/login", loginUser);

// Verify OTP
router.post("/verify-login-otp", verifyLoginOtp);

// Resend OTP
router.post("/resend-login-otp", resendLoginOtp);

// Logout
router.post("/logout", logoutUser);

// Referral code and link
router.get("/referral", authenticateUser, getMyReferral);

module.exports = router;

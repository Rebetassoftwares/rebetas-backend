const User = require("../models/User");

async function authenticateUser(req, res, next) {
  try {
    // ✅🔥 CRITICAL FIX — ALLOW PREFLIGHT
    if (req.method === "OPTIONS") {
      return next();
    }

    const authHeader = req.headers.authorization;

    // ✅ STRICT HEADER CHECK
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const deviceToken = authHeader.split(" ")[1];

    if (!deviceToken) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    // ✅ FIND USER BY TOKEN
    const user = await User.findOne({
      activeDeviceToken: deviceToken,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid session",
      });
    }

    // 🔥 HARD SESSION VALIDATION
    if (user.activeDeviceToken !== deviceToken) {
      return res.status(401).json({
        message: "Session expired (logged in on another device)",
      });
    }

    if (!user.isActive && user.isActive !== undefined) {
      return res.status(403).json({
        message: "Account is deactivated",
      });
    }

    req.user = user;
    req.deviceToken = deviceToken;

    next();
  } catch (error) {
    console.error("Auth error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
}

module.exports = authenticateUser;

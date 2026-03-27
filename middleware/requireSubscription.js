const Subscription = require("../models/Subscription");

async function requireSubscription(req, res, next) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const now = new Date();

    const subscription = await Subscription.findOne({
      userId: user._id,
      status: "active",
      endDate: { $gt: now },
    });

    if (!subscription) {
      return res.status(403).json({
        message: "Active subscription required",
      });
    }

    req.subscription = subscription;

    next();
  } catch (error) {
    console.error("Subscription middleware error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
}

module.exports = requireSubscription;

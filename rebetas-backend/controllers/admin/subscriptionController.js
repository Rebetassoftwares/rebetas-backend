const Subscription = require("../../models/Subscription");

async function getSubscriptions(req, res) {
  try {
    const subscriptions = await Subscription.find({})
      .sort({ createdAt: -1 })
      .lean();

    res.json(subscriptions);
  } catch (error) {
    console.error("Subscription fetch error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

async function getUserSubscriptions(req, res) {
  try {
    const subs = await Subscription.find({
      userId: req.params.userId,
    }).lean();

    res.json(subs);
  } catch (error) {
    console.error("User subscription error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

async function cancelSubscription(req, res) {
  try {
    await Subscription.findByIdAndUpdate(req.params.id, {
      status: "cancelled",
    });

    res.json({ message: "Subscription cancelled" });
  } catch (error) {
    console.error("Cancel subscription error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getSubscriptions,
  getUserSubscriptions,
  cancelSubscription,
};

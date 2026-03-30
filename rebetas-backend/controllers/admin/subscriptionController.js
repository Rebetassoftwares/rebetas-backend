const Subscription = require("../../models/Subscription");
const User = require("../../models/User");

async function getSubscriptions(req, res) {
  try {
    const subscriptions = await Subscription.find({})
      .sort({ createdAt: -1 })
      .lean();

    const userIds = subscriptions.map((s) => s.userId).filter(Boolean);

    const users = await User.find({
      _id: { $in: userIds },
    })
      .select("username email fullName country")
      .lean();

    const userMap = {};
    users.forEach((user) => {
      userMap[user._id.toString()] = user;
    });

    const enrichedSubscriptions = subscriptions.map((subscription) => ({
      ...subscription,
      userId: userMap[subscription.userId?.toString()] || subscription.userId,
    }));

    res.json(enrichedSubscriptions);
  } catch (error) {
    console.error("Subscription fetch error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

async function getUserSubscriptions(req, res) {
  try {
    const subs = await Subscription.find({
      userId: req.params.userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    const user = await User.findById(req.params.userId)
      .select("username email fullName country")
      .lean();

    const enrichedSubs = subs.map((sub) => ({
      ...sub,
      userId: user || sub.userId,
    }));

    res.json(enrichedSubs);
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

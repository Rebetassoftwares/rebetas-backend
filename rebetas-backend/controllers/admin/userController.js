const User = require("../../models/User");
const Subscription = require("../../models/Subscription");

/* ---------------- GET ALL USERS (WITH SUBSCRIPTION) ---------------- */

async function getUsers(req, res) {
  try {
    const users = await User.find({})
      .select("-password -activeDeviceToken")
      .sort({ createdAt: -1 })
      .lean();

    const userIds = users.map((u) => u._id);

    const subscriptions = await Subscription.find({
      userId: { $in: userIds },
    }).lean();

    // Map subscriptions by userId
    const subMap = {};
    subscriptions.forEach((sub) => {
      subMap[sub.userId.toString()] = sub;
    });

    const enrichedUsers = users.map((user) => ({
      ...user,
      accountStatus: user.accountStatus || "active",
      subscription: subMap[user._id.toString()] || null,
    }));

    res.json(enrichedUsers);
  } catch (error) {
    console.error("Admin users error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

/* ---------------- GET SINGLE USER ---------------- */

async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -activeDeviceToken")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const subscription = await Subscription.findOne({
      userId: user._id,
    }).lean();

    res.json({
      ...user,
      accountStatus: user.accountStatus || "active",
      subscription: subscription || null,
    });
  } catch (error) {
    console.error("Admin user fetch error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

/* ---------------- UPDATE USER STATUS ---------------- */

async function updateUserStatus(req, res) {
  try {
    const { status } = req.body;

    if (!["active", "suspended", "banned"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { accountStatus: status },
      { new: true },
    ).select("-password -activeDeviceToken");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    console.error("Status update error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

/* ---------------- RESET DEVICE ---------------- */

async function resetUserDevice(req, res) {
  try {
    await User.findByIdAndUpdate(req.params.id, {
      activeDeviceToken: null,
    });

    res.json({ message: "User device session reset" });
  } catch (error) {
    console.error("Device reset error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

/* ---------------- DELETE USER ---------------- */

async function deleteUser(req, res) {
  try {
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "User deleted" });
  } catch (error) {
    console.error("User delete error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getUsers,
  getUserById,
  updateUserStatus,
  resetUserDevice,
  deleteUser,
};

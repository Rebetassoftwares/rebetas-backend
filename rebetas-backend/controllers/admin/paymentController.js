const Payment = require("../../models/Payment");
const User = require("../../models/User");

async function getPayments(req, res) {
  try {
    const payments = await Payment.find({}).sort({ createdAt: -1 }).lean();

    const userIds = payments.map((p) => p.userId).filter(Boolean);

    const users = await User.find({
      _id: { $in: userIds },
    })
      .select("username email fullName country")
      .lean();

    const userMap = {};
    users.forEach((user) => {
      userMap[user._id.toString()] = user;
    });

    const enrichedPayments = payments.map((payment) => ({
      ...payment,
      userId: userMap[payment.userId?.toString()] || payment.userId,
    }));

    res.json(enrichedPayments);
  } catch (error) {
    console.error("Payments fetch error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

async function getPaymentById(req, res) {
  try {
    const payment = await Payment.findById(req.params.id).lean();

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const user = await User.findById(payment.userId)
      .select("username email fullName country")
      .lean();

    res.json({
      ...payment,
      userId: user || payment.userId,
    });
  } catch (error) {
    console.error("Payment fetch error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

async function getUserPayments(req, res) {
  try {
    const payments = await Payment.find({
      userId: req.params.userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    const user = await User.findById(req.params.userId)
      .select("username email fullName country")
      .lean();

    const enrichedPayments = payments.map((payment) => ({
      ...payment,
      userId: user || payment.userId,
    }));

    res.json(enrichedPayments);
  } catch (error) {
    console.error("User payments error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getPayments,
  getPaymentById,
  getUserPayments,
};

const Payment = require("../../models/Payment");

async function getPayments(req, res) {
  try {
    const payments = await Payment.find({})
      .populate("userId", "username email fullName country") // 🔥 ADD THIS
      .sort({ createdAt: -1 })
      .lean();

    res.json(payments);
  } catch (error) {
    console.error("Payments fetch error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

async function getPaymentById(req, res) {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("userId", "username email fullName country")
      .lean();

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json(payment);
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
      .populate("userId", "username email fullName country")
      .lean();

    res.json(payments);
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

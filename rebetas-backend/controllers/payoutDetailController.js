const axios = require("axios");
const PayoutDetail = require("../models/PayoutDetail");

/* =========================
   GET MY PAYOUT DETAILS
========================= */
exports.getMyPayoutDetail = async (req, res) => {
  try {
    const payout = await PayoutDetail.findOne({
      ownerId: req.user._id,
    });

    res.json(payout || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   SAVE / UPDATE
========================= */
exports.saveMyPayoutDetail = async (req, res) => {
  try {
    const { accountNumber, bankName, bankCode } = req.body;

    // 🔥 VERIFY AGAIN ON SERVER (SOURCE OF TRUTH)
    const response = await axios.post(
      "https://api.flutterwave.com/v3/accounts/resolve",
      {
        account_number: accountNumber,
        account_bank: bankCode,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET}`,
        },
      },
    );

    const accountName = response.data.data.account_name;

    if (!accountName || !accountNumber || !bankName || !bankCode) {
      return res.status(400).json({ message: "All fields required" });
    }

    const payout = await PayoutDetail.findOneAndUpdate(
      { ownerId: req.user._id },
      {
        ownerId: req.user._id,
        accountName,
        accountNumber,
        bankName,
        bankCode,
      },
      { new: true, upsert: true },
    );

    res.json(payout);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save payout details" });
  }
};

/* =========================
   GET BANK LIST
========================= */
exports.getBanks = async (req, res) => {
  try {
    const country = req.query.country || "NG";

    const response = await axios.get(
      `https://api.flutterwave.com/v3/banks/${country}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET}`,
        },
      },
    );

    res.json(response.data.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: "Failed to fetch banks" });
  }
};

/* =========================
   VERIFY ACCOUNT
========================= */
exports.verifyAccount = async (req, res) => {
  try {
    const { accountNumber, bankCode } = req.body;

    const response = await axios.post(
      "https://api.flutterwave.com/v3/accounts/resolve",
      {
        account_number: accountNumber,
        account_bank: bankCode,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET}`,
        },
      },
    );

    res.json(response.data.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(400).json({ message: "Invalid account details" });
  }
};

const InvestmentAccount = require("../models/InvestmentAccount");
const InvestmentTransaction = require("../models/InvestmentTransaction");
const InvestmentWithdrawal = require("../models/InvestmentWithdrawal");
const User = require("../models/User");

async function getAutoPilotAnalytics(req, res) {
  try {
    const { limit = 10 } = req.query;

    const resultLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);

    const [
      topCapitalAccounts,
      topProfitAccounts,
      topProfitEarners,
      topWithdrawals,
      packagePerformance,
      transactionSummary,
    ] = await Promise.all([
      InvestmentAccount.find({})
        .sort({ capitalBalance: -1 })
        .limit(resultLimit)
        .lean(),

      InvestmentAccount.find({})
        .sort({ profitBalance: -1 })
        .limit(resultLimit)
        .lean(),

      InvestmentAccount.find({})
        .sort({ totalProfitEarned: -1 })
        .limit(resultLimit)
        .lean(),

      InvestmentWithdrawal.find({ status: "successful" })
        .sort({ amount: -1 })
        .limit(resultLimit)
        .lean(),

      InvestmentAccount.aggregate([
        {
          $group: {
            _id: "$packageId",
            packageName: { $first: "$packageNameSnapshot" },
            currency: { $first: "$currency" },
            totalAccounts: { $sum: 1 },
            activeAccounts: {
              $sum: {
                $cond: [{ $eq: ["$status", "active"] }, 1, 0],
              },
            },
            totalCapitalBalance: { $sum: "$capitalBalance" },
            totalProfitBalance: { $sum: "$profitBalance" },
            totalProfitEarned: { $sum: "$totalProfitEarned" },
            totalProfitWithdrawn: { $sum: "$totalProfitWithdrawn" },
            totalCapitalWithdrawn: { $sum: "$totalCapitalWithdrawn" },
          },
        },
        {
          $sort: {
            totalCapitalBalance: -1,
          },
        },
      ]),

      InvestmentTransaction.aggregate([
        {
          $group: {
            _id: {
              type: "$type",
              status: "$status",
              currency: "$currency",
            },
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
          },
        },
        {
          $sort: {
            totalAmount: -1,
          },
        },
      ]),
    ]);

    const userIds = [
      ...new Set(
        [
          ...topCapitalAccounts,
          ...topProfitAccounts,
          ...topProfitEarners,
          ...topWithdrawals,
        ]
          .map((item) => item.userId?.toString())
          .filter(Boolean),
      ),
    ];

    const users = await User.find({
      _id: { $in: userIds },
    })
      .select("fullName username email phone country")
      .lean();

    const userMap = {};

    users.forEach((user) => {
      userMap[user._id.toString()] = user;
    });

    const enrichWithUser = (items) =>
      items.map((item) => ({
        ...item,
        user: userMap[item.userId?.toString()] || null,
      }));

    return res.status(200).json({
      success: true,
      data: {
        topCapitalAccounts: enrichWithUser(topCapitalAccounts),
        topProfitAccounts: enrichWithUser(topProfitAccounts),
        topProfitEarners: enrichWithUser(topProfitEarners),
        topWithdrawals: enrichWithUser(topWithdrawals),
        packagePerformance,
        transactionSummary,
      },
    });
  } catch (error) {
    console.error("AutoPilot analytics error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch AutoPilot analytics",
    });
  }
}

module.exports = {
  getAutoPilotAnalytics,
};

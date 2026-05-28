const Referral = require("../models/Referral");
const ReferralBonus = require("../models/ReferralBonus");

const { buildReferralLink } = require("../services/referralService");

const getUserId = (req) => req.user?._id || req.user?.id;

async function getReferralDashboard(req, res) {
  try {
    const user = req.user;
    const userId = getUserId(req);

    const referredUsersCount = await Referral.countDocuments({
      referrer: userId,
      status: "active",
    });

    const totalBonusesCount = await ReferralBonus.countDocuments({
      referrer: userId,
      status: "credited",
    });

    const recentBonuses = await ReferralBonus.find({
      referrer: userId,
    })
      .populate("referredUser", "fullName username country currency")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralLink: buildReferralLink(user.referralCode),

        referralBalance: user.referralBalance || 0,
        totalReferralEarned: user.totalReferralEarned || 0,
        currency: user.currency || "USD",

        referredUsersCount,
        totalBonusesCount,
        recentBonuses,
      },
    });
  } catch (error) {
    console.error("Referral dashboard error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch referral dashboard",
    });
  }
}

async function getReferralBonuses(req, res) {
  try {
    const userId = getUserId(req);
    const { sourceType, status, page = 1, limit = 20 } = req.query;

    const filter = { referrer: userId };

    if (sourceType) filter.sourceType = sourceType;
    if (status) filter.status = status;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * pageSize;

    const [bonuses, total] = await Promise.all([
      ReferralBonus.find(filter)
        .populate("referredUser", "fullName username country currency")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),

      ReferralBonus.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        bonuses,
        pagination: {
          total,
          page: pageNumber,
          limit: pageSize,
          pages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("Referral bonuses error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch referral bonuses",
    });
  }
}

async function getReferredUsers(req, res) {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 20 } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * pageSize;

    const [referrals, total] = await Promise.all([
      Referral.find({ referrer: userId })
        .populate(
          "referredUser",
          "fullName username country currency emailVerified accountStatus createdAt",
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),

      Referral.countDocuments({ referrer: userId }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        referrals,
        pagination: {
          total,
          page: pageNumber,
          limit: pageSize,
          pages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("Referred users error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch referred users",
    });
  }
}

module.exports = {
  getReferralDashboard,
  getReferralBonuses,
  getReferredUsers,
};

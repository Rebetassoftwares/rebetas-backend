const { creditDailyProfits } = require("../services/dailyProfitService");

async function creditDailyProfitController(req, res) {
  try {
    const result = await creditDailyProfits({
      adminId: req.user?._id || null,
    });

    return res.status(200).json({
      success: true,
      message: "Daily Profit Credit applied successfully",
      data: result,
    });
  } catch (error) {
    console.error("Daily Profit Credit error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to apply Daily Profit Credit",
    });
  }
}

module.exports = {
  creditDailyProfitController,
};

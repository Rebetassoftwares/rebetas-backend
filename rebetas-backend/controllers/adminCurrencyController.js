const CurrencyRate = require("../models/CurrencyRate");

function normalizeCurrency(currency) {
  return String(currency || "")
    .trim()
    .toUpperCase();
}

async function getCurrencyRates(req, res) {
  try {
    const { baseCurrency, targetCurrency, isActive } = req.query;

    const filter = {};

    if (baseCurrency) {
      filter.baseCurrency = normalizeCurrency(baseCurrency);
    }

    if (targetCurrency) {
      filter.targetCurrency = normalizeCurrency(targetCurrency);
    }

    if (isActive === "true") {
      filter.isActive = true;
    }

    if (isActive === "false") {
      filter.isActive = false;
    }

    const rates = await CurrencyRate.find(filter)
      .populate("updatedBy", "fullName username email")
      .sort({
        baseCurrency: 1,
        targetCurrency: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      data: rates,
    });
  } catch (error) {
    console.error("Get currency rates error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch currency rates",
    });
  }
}

async function upsertCurrencyRate(req, res) {
  try {
    const {
      baseCurrency = "USD",
      targetCurrency,
      rate,
      isActive = true,
    } = req.body;

    const base = normalizeCurrency(baseCurrency);
    const target = normalizeCurrency(targetCurrency);
    const numericRate = Number(rate);

    if (!base || !target) {
      return res.status(400).json({
        success: false,
        message: "Base currency and target currency are required",
      });
    }

    if (base === target) {
      return res.status(400).json({
        success: false,
        message: "Base currency and target currency cannot be the same",
      });
    }

    if (!numericRate || Number.isNaN(numericRate) || numericRate <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid exchange rate is required",
      });
    }

    const rateRecord = await CurrencyRate.findOneAndUpdate(
      {
        baseCurrency: base,
        targetCurrency: target,
      },
      {
        baseCurrency: base,
        targetCurrency: target,
        rate: numericRate,
        isActive: Boolean(isActive),
        updatedBy: req.user?._id || req.user?.id || null,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).populate("updatedBy", "fullName username email");

    return res.status(200).json({
      success: true,
      message: "Currency rate saved successfully",
      data: rateRecord,
    });
  } catch (error) {
    console.error("Save currency rate error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to save currency rate",
    });
  }
}

async function updateCurrencyRateStatus(req, res) {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const rateRecord = await CurrencyRate.findByIdAndUpdate(
      req.params.id,
      {
        isActive,
        updatedBy: req.user?._id || req.user?.id || null,
      },
      {
        new: true,
        runValidators: true,
      },
    ).populate("updatedBy", "fullName username email");

    if (!rateRecord) {
      return res.status(404).json({
        success: false,
        message: "Currency rate not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Currency rate activated successfully"
        : "Currency rate deactivated successfully",
      data: rateRecord,
    });
  } catch (error) {
    console.error("Update currency rate status error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update currency rate status",
    });
  }
}

async function deleteCurrencyRate(req, res) {
  try {
    const rateRecord = await CurrencyRate.findByIdAndDelete(req.params.id);

    if (!rateRecord) {
      return res.status(404).json({
        success: false,
        message: "Currency rate not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Currency rate deleted successfully",
    });
  } catch (error) {
    console.error("Delete currency rate error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete currency rate",
    });
  }
}

module.exports = {
  getCurrencyRates,
  upsertCurrencyRate,
  updateCurrencyRateStatus,
  deleteCurrencyRate,
};

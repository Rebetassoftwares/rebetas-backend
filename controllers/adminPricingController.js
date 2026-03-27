const CountryPricing = require("../models/CountryPricing");

/*
ADD COUNTRY PRICING
*/

async function createCountryPricing(req, res) {
  try {
    const {
      country,
      currency,
      weeklyPrice,
      monthlyPrice,
      yearlyPrice,
      isDefault,
    } = req.body;

    if (
      !country ||
      !currency ||
      !weeklyPrice ||
      !monthlyPrice ||
      !yearlyPrice
    ) {
      return res.status(400).json({
        message: "All pricing fields are required",
      });
    }

    const existing = await CountryPricing.findOne({ country });

    if (existing) {
      return res.status(400).json({
        message: "Pricing for this country already exists",
      });
    }

    /*
    Only one default pricing allowed
    */

    if (isDefault === true) {
      await CountryPricing.updateMany(
        { isDefault: true },
        { isDefault: false },
      );
    }

    const pricing = await CountryPricing.create({
      country,
      currency,
      weeklyPrice,
      monthlyPrice,
      yearlyPrice,
      isDefault: isDefault || false,
    });

    res.status(201).json(pricing);
  } catch (error) {
    console.error("Create pricing error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
}

/*
GET ALL PRICING
*/

async function getAllPricing(req, res) {
  try {
    const pricing = await CountryPricing.find({}).sort({ country: 1 }).lean();

    res.json(pricing);
  } catch (error) {
    console.error("Pricing list error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
}

/*
UPDATE PRICING
*/

async function updatePricing(req, res) {
  try {
    const { id } = req.params;

    const {
      country,
      currency,
      weeklyPrice,
      monthlyPrice,
      yearlyPrice,
      isDefault,
    } = req.body;

    if (isDefault === true) {
      await CountryPricing.updateMany(
        { isDefault: true },
        { isDefault: false },
      );
    }

    const updated = await CountryPricing.findByIdAndUpdate(
      id,
      {
        ...(country !== undefined && { country }),
        ...(currency !== undefined && { currency }),
        ...(weeklyPrice !== undefined && { weeklyPrice }),
        ...(monthlyPrice !== undefined && { monthlyPrice }),
        ...(yearlyPrice !== undefined && { yearlyPrice }),
        ...(isDefault !== undefined && { isDefault }),
      },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({
        message: "Pricing not found",
      });
    }

    res.json(updated);
  } catch (error) {
    console.error("Update pricing error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
}

/*
DELETE PRICING
*/

async function deletePricing(req, res) {
  try {
    const { id } = req.params;

    const deleted = await CountryPricing.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        message: "Pricing not found",
      });
    }

    res.json({
      message: "Pricing deleted",
    });
  } catch (error) {
    console.error("Delete pricing error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
}

module.exports = {
  createCountryPricing,
  getAllPricing,
  updatePricing,
  deletePricing,
};

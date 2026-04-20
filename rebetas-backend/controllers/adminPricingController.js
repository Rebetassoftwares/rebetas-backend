const CountryPricing = require("../models/CountryPricing");

/*
ADD COUNTRY PRICING
*/

async function createCountryPricing(req, res) {
  try {
    let {
      country,
      currency,
      weeklyPrice,
      monthlyPrice,
      yearlyPrice,
      isDefault,
    } = req.body;

    country = String(country).trim();

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

    // ✅ prevent duplicate (case insensitive)
    const existing = await CountryPricing.findOne({
      country: new RegExp(`^${country}$`, "i"),
    });

    if (existing) {
      return res.status(400).json({
        message: "Pricing for this country already exists",
      });
    }

    // ✅ ensure ONLY ONE "Others"
    if (country.toLowerCase() === "others") {
      const othersExists = await CountryPricing.findOne({
        country: new RegExp("^others$", "i"),
      });

      if (othersExists) {
        return res.status(400).json({
          message: '"Others" pricing already exists',
        });
      }
    }

    // ✅ only one default
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
    const pricing = await CountryPricing.find({}).lean();

    // ✅ sort with "Others" always last
    const sorted = pricing.sort((a, b) => {
      if (a.country.toLowerCase() === "others") return 1;
      if (b.country.toLowerCase() === "others") return -1;
      return a.country.localeCompare(b.country);
    });

    res.json(sorted);
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

    let {
      country,
      currency,
      weeklyPrice,
      monthlyPrice,
      yearlyPrice,
      isDefault,
    } = req.body;

    if (country !== undefined) {
      country = String(country).trim();

      // ✅ prevent duplicate on update
      const existing = await CountryPricing.findOne({
        _id: { $ne: id },
        country: new RegExp(`^${country}$`, "i"),
      });

      if (existing) {
        return res.status(400).json({
          message: "Another pricing with this country already exists",
        });
      }

      // ✅ ensure ONLY ONE "Others"
      if (country.toLowerCase() === "others") {
        const othersExists = await CountryPricing.findOne({
          _id: { $ne: id },
          country: new RegExp("^others$", "i"),
        });

        if (othersExists) {
          return res.status(400).json({
            message: '"Others" pricing already exists',
          });
        }
      }
    }

    // ✅ only one default
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

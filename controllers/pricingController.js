const CountryPricing = require("../models/CountryPricing");

exports.getPublicPricing = async (req, res) => {
  try {
    const pricing = await CountryPricing.find().sort({ country: 1 });

    res.json({
      success: true,
      pricing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch pricing",
    });
  }
};

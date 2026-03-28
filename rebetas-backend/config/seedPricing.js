const CountryPricing = require("../models/CountryPricing");

async function seedDefaultPricing() {
  try {
    const count = await CountryPricing.countDocuments();

    if (count > 0) {
      console.log("✅ Pricing already exists, skipping seed...");
      return;
    }

    console.log("🌱 Seeding default pricing...");

    await CountryPricing.insertMany([
      {
        country: "Nigeria",
        currency: "NGN", // ✅ FIXED
        weeklyPrice: 1000,
        monthlyPrice: 3000,
        yearlyPrice: 30000,
        isDefault: true,
      },
      {
        country: "Ghana",
        currency: "GHS", // ✅ FIXED
        weeklyPrice: 50,
        monthlyPrice: 150,
        yearlyPrice: 1500,
      },
      {
        country: "Kenya",
        currency: "KES", // ✅ FIXED
        weeklyPrice: 200,
        monthlyPrice: 600,
        yearlyPrice: 6000,
      },
      {
        country: "South Africa",
        currency: "ZAR", // ✅ FIXED
        weeklyPrice: 80,
        monthlyPrice: 240,
        yearlyPrice: 2400,
      },
      {
        country: "International",
        currency: "USD", // ✅ FIXED
        weeklyPrice: 5,
        monthlyPrice: 15,
        yearlyPrice: 150,
      },
    ]);

    console.log("🔥 Default pricing seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding pricing:", error.message);
  }
}

module.exports = seedDefaultPricing;

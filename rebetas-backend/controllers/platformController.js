const Platform = require("../models/Platform");
const ManualLeague = require("../models/ManualLeague");

const mongoose = require("mongoose");

exports.createPlatform = async (req, res) => {
  try {
    let { name, country, logo: bodyLogo, isActive } = req.body;

    // ✅ normalize boolean (FormData sends string)
    if (typeof isActive === "string") {
      isActive = isActive === "true";
    }

    // ✅ basic validation (safe)
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Platform name is required" });
    }

    // ✅ handle file upload OR fallback string
    const logo = req.file ? req.file.path : bodyLogo;

    const platform = await Platform.create({
      name: name.trim(),
      country: country?.trim() || "",
      logo,
      isActive: typeof isActive === "boolean" ? isActive : true,
    });

    res.status(201).json(platform);
  } catch (err) {
    console.error("Create platform error:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        message: "Platform already exists",
      });
    }

    res.status(500).json({ message: "Failed to create platform" });
  }
};

exports.getPlatforms = async (req, res) => {
  try {
    const platforms = await Platform.find().sort({ name: 1 });
    res.json(platforms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch platforms" });
  }
};

exports.updatePlatform = async (req, res) => {
  try {
    const platform = await Platform.findById(req.params.id);

    if (!platform) {
      return res.status(404).json({ message: "Platform not found" });
    }

    let { name, country, logo: bodyLogo, isActive } = req.body;

    // ✅ normalize boolean
    if (typeof isActive === "string") {
      isActive = isActive === "true";
    }

    // ✅ safe updates
    if (name !== undefined) platform.name = name.trim();
    if (country !== undefined) platform.country = country?.trim() || "";

    // ✅ file upload takes priority
    if (req.file) {
      platform.logo = req.file.path;
    } else if (bodyLogo !== undefined) {
      platform.logo = bodyLogo;
    }

    if (isActive !== undefined) {
      platform.isActive = Boolean(isActive);
    }

    await platform.save();

    res.json(platform);
  } catch (err) {
    console.error("Update platform error:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        message: "Platform already exists",
      });
    }

    res.status(500).json({ message: "Failed to update platform" });
  }
};

exports.deletePlatform = async (req, res) => {
  try {
    await Platform.findByIdAndDelete(req.params.id);
    res.json({ message: "Platform deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete platform" });
  }
};

exports.getLeaguesByPlatform = async (req, res) => {
  try {
    const { platformId } = req.params;

    // 🔥 ensure valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(platformId)) {
      return res.status(400).json({ message: "Invalid platformId" });
    }

    const leagues = await ManualLeague.find({
      platformId: new mongoose.Types.ObjectId(platformId),
    })
      .populate("platformId", "name logo country")
      .sort({ leagueName: 1 });

    res.json(leagues);
  } catch (err) {
    console.error("Fetch leagues by platform error:", err);
    res.status(500).json({ message: "Failed to fetch leagues" });
  }
};

exports.getPlatformById = async (req, res) => {
  try {
    const platform = await Platform.findById(req.params.id);

    if (!platform) {
      return res.status(404).json({ message: "Platform not found" });
    }

    res.json(platform);
  } catch (err) {
    console.error("Get platform error:", err);
    res.status(500).json({ message: "Failed to fetch platform" });
  }
};

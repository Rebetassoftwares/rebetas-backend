const InvestmentPackage = require("../models/InvestmentPackage");

exports.createPackage = async (req, res) => {
  try {
    const {
      name,
      amount,
      currency = "USD",
      dailyReturnPercentage,
      benefits = [],
      description = "",
      sortOrder = 0,
      isActive = true,
      minimumUpgradeAmount = 0,
    } = req.body;

    if (!name || amount == null || dailyReturnPercentage == null) {
      return res.status(400).json({
        success: false,
        message: "Name, amount, and daily return percentage are required",
      });
    }

    const investmentPackage = await InvestmentPackage.create({
      name,
      amount,
      currency,
      dailyReturnPercentage,
      benefits,
      description,
      sortOrder,
      isActive,
      minimumUpgradeAmount,
      createdBy: req.user?._id || req.user?.id || null,
    });

    return res.status(201).json({
      success: true,
      message: "AutoPilot Package created successfully",
      data: investmentPackage,
    });
  } catch (error) {
    console.error("Create AutoPilot Package error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create AutoPilot Package",
    });
  }
};

exports.getPackages = async (req, res) => {
  try {
    const packages = await InvestmentPackage.find().sort({
      sortOrder: 1,
      amount: 1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: packages,
    });
  } catch (error) {
    console.error("Get AutoPilot Packages error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch AutoPilot Packages",
    });
  }
};

exports.getPackageById = async (req, res) => {
  try {
    const investmentPackage = await InvestmentPackage.findById(req.params.id);

    if (!investmentPackage) {
      return res.status(404).json({
        success: false,
        message: "AutoPilot Package not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: investmentPackage,
    });
  } catch (error) {
    console.error("Get AutoPilot Package error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch AutoPilot Package",
    });
  }
};

exports.updatePackage = async (req, res) => {
  try {
    const allowedUpdates = [
      "name",
      "amount",
      "currency",
      "dailyReturnPercentage",
      "benefits",
      "description",
      "sortOrder",
      "isActive",
      "minimumUpgradeAmount",
    ];

    const updateData = {};

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    updateData.updatedBy = req.user?._id || req.user?.id || null;

    const investmentPackage = await InvestmentPackage.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!investmentPackage) {
      return res.status(404).json({
        success: false,
        message: "AutoPilot Package not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "AutoPilot Package updated successfully",
      data: investmentPackage,
    });
  } catch (error) {
    console.error("Update AutoPilot Package error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update AutoPilot Package",
    });
  }
};

exports.deactivatePackage = async (req, res) => {
  try {
    const investmentPackage = await InvestmentPackage.findByIdAndUpdate(
      req.params.id,
      {
        isActive: false,
        updatedBy: req.user?._id || req.user?.id || null,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!investmentPackage) {
      return res.status(404).json({
        success: false,
        message: "AutoPilot Package not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "AutoPilot Package deactivated successfully",
      data: investmentPackage,
    });
  } catch (error) {
    console.error("Deactivate AutoPilot Package error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to deactivate AutoPilot Package",
    });
  }
};

exports.activatePackage = async (req, res) => {
  try {
    const investmentPackage = await InvestmentPackage.findByIdAndUpdate(
      req.params.id,
      {
        isActive: true,
        updatedBy: req.user?._id || req.user?.id || null,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!investmentPackage) {
      return res.status(404).json({
        success: false,
        message: "AutoPilot Package not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "AutoPilot Package activated successfully",
      data: investmentPackage,
    });
  } catch (error) {
    console.error("Activate AutoPilot Package error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to activate AutoPilot Package",
    });
  }
};

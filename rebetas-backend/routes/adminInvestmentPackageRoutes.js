const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authenticateUser");
const requireAdmin = require("../middleware/requireAdmin");

const adminInvestmentPackageController = require("../controllers/adminInvestmentPackageController");

router.post(
  "/",
  authenticateUser,
  requireAdmin,
  adminInvestmentPackageController.createPackage,
);

router.get(
  "/",
  authenticateUser,
  requireAdmin,
  adminInvestmentPackageController.getPackages,
);

router.get(
  "/:id",
  authenticateUser,
  requireAdmin,
  adminInvestmentPackageController.getPackageById,
);

router.patch(
  "/:id",
  authenticateUser,
  requireAdmin,
  adminInvestmentPackageController.updatePackage,
);

router.patch(
  "/:id/deactivate",
  authenticateUser,
  requireAdmin,
  adminInvestmentPackageController.deactivatePackage,
);

router.patch(
  "/:id/activate",
  authenticateUser,
  requireAdmin,
  adminInvestmentPackageController.activatePackage,
);

module.exports = router;

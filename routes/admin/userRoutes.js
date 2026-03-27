const express = require("express");

const router = express.Router();

const authenticateUser = require("../../middleware/authenticateUser");
const requireAdmin = require("../../middleware/requireAdmin");

const {
  getUsers,
  getUserById,
  resetUserDevice,
  updateUserStatus,
  deleteUser,
} = require("../../controllers/admin/userController");

router.get("/", authenticateUser, requireAdmin, getUsers);
router.get("/:id", authenticateUser, requireAdmin, getUserById);

router.patch(
  "/:id/reset-device",
  authenticateUser,
  requireAdmin,
  resetUserDevice,
);

router.patch("/:id/status", authenticateUser, requireAdmin, updateUserStatus);

router.delete("/:id", authenticateUser, requireAdmin, deleteUser);

module.exports = router;

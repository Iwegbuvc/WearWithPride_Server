const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getProfile,
  logoutUser,
  handleRefreshToken,
  forgotPassword,
  resetPassword,
} = require("../controllers/user/userController");
const {
  validateNewUser,
  validateLogin,
  validatePassword,
} = require("../middleware/validate");
const { verifyToken } = require("../middleware/validateToken");
const { authLimiter } = require("../middleware/rateLimiter");

router.post("/register", authLimiter, validateNewUser, registerUser);
router.post("/login", authLimiter, validateLogin, loginUser);
// 🔐 Protected profile route
router.get("/myProfile", verifyToken, getProfile);
router.post("/logout", verifyToken, logoutUser);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, validatePassword, resetPassword);
// Refresh token rotation route
router.post("/refresh-token", handleRefreshToken);

module.exports = router;

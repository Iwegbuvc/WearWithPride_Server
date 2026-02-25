const jwt = require("jsonwebtoken");
const User = require("../models/usersModel");
const BlacklistedToken = require("../models/blackListTokenModel");

const verifyToken = async (req, res, next) => {
  const tokenString = req.headers.authorization;
  if (!tokenString) {
    return res.status(401).json({ message: "Authorization token is missing" });
  } // Expecting format: "Bearer <token>"

  const token = tokenString.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authorization token is missing" });
  }

  try {
    // 2. CHECK TOKEN BLACKLIST FIRST
    const blacklisted = await BlacklistedToken.findOne({ token }).lean();
    if (blacklisted) {
      // If the token is found in the blacklist, it was explicitly revoked (logged out)
      return res
        .status(401)
        .json({ message: "Invalid or expired token (Logged out)" });
    } // 3. Standard JWT verification (signature and expiration check)
    // ----------------------------------------------------
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // 4. User lookup (Your existing logic)
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    } // Attach safe user info to request

    // 🔥 BLOCKED USER CHECK
    if (user.status === "Blocked") {
      return res.status(403).json({
        message: "Your account has been blocked. Contact support.",
      });
    }

    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    next();
  } catch (error) {
    console.error("Token verification error:", error); // This error now correctly handles: Signature failure, expired token, or blacklisted token
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }
  next();
};
const userOnly = (req, res, next) => {
  if (!req.user?.role || req.user.role !== "user") {
    console.warn(`Access denied for user: ${req.user?.id || "unknown"}`);
    return res.status(403).json({ message: "Access denied: Users only" });
  }
  next();
};

module.exports = { verifyToken, isAdmin, userOnly };

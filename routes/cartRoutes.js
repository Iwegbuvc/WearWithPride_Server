const express = require("express");
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../controllers/cart/cartController");

const { verifyToken } = require("../middleware/validateToken");
const {
  createUpdateLimiter,
  deleteLimiter,
} = require("../middleware/rateLimiter");

const router = express.Router();

// all cart routes require auth
router.get("/", verifyToken, getCart);
router.post("/add", verifyToken, createUpdateLimiter, addToCart);
router.put("/item/:itemId", verifyToken, createUpdateLimiter, updateCartItem);
router.delete("/item/:itemId", verifyToken, deleteLimiter, removeCartItem);
router.delete("/clear", verifyToken, deleteLimiter, clearCart);

module.exports = router;

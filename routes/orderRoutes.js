const express = require("express");
const { verifyToken } = require("../middleware/validateToken");
const {
  getMyOrders,
  getOrderById,
} = require("../controllers/order/orderController");
const { searchLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.get("/my-orders", verifyToken, searchLimiter, getMyOrders);
router.get("/:id", verifyToken, getOrderById);

module.exports = router;

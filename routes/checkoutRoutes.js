const express = require("express");
const paystackWebhook = require("../controllers/paystack/paystackwebhookController");
const {
  createCheckout,
  verifyPayment,
  initializePayment,
} = require("../controllers/checkout/checkoutController");
const { verifyToken } = require("../middleware/validateToken");
const {
  checkoutLimiter,
  webhookLimiter,
} = require("../middleware/rateLimiter");

const router = express.Router();

// router.post("/paystack/webhook", webhookLimiter, paystackWebhook);

// Create order from cart
router.post("/", verifyToken, checkoutLimiter, createCheckout);

router.post("/initialize", verifyToken, checkoutLimiter, initializePayment);

// Verify Paystack payment
router.post("/verify", verifyToken, checkoutLimiter, verifyPayment);

module.exports = router;

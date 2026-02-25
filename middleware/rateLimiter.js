const rateLimit = require("express-rate-limit");
// 🔒 General API Rate Limiter (all endpoints)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per 15 minutes
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for webhook requests
    return req.path === "/api/checkout/paystack/webhook";
  },
});

// 🔒 Auth Limiter (stricter for login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 attempts per 15 minutes
  message:
    "Too many login/register attempts from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// 🔒 Checkout Limiter (moderate for payment operations)
const checkoutLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Max 10 checkout requests per 10 minutes
  message: "Too many checkout requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// 🔒 Admin Limiter (stricter for admin operations)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Max 50 requests per 15 minutes for admin operations
  message: "Too many admin requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for webhook
    return req.path === "/api/checkout/paystack/webhook";
  },
});

// 🔒 Product Search Limiter (for high-volume search operations)
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Max 30 search requests per minute
  message: "Too many search requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// 🔒 Password Reset Limiter (very strict)
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 attempts per hour
  message:
    "Too many password reset attempts. Please try again later or contact support.",
  standardHeaders: true,
  legacyHeaders: false,
});

// 🔒 Webhook Limiter (allow webhooks from Paystack)
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Allow more webhook requests
  message: "Webhook rate limit exceeded",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Only apply to webhook endpoint
    return !req.path.includes("webhook");
  },
});

// 🔒 Create/Update Limiter (for creating/updating resources)
const createUpdateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Max 20 create/update requests per minute
  message: "Too many create/update requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// 🔒 Delete Limiter (very strict for deletions)
const deleteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 delete requests per 15 minutes
  message: "Too many delete requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  checkoutLimiter,
  adminLimiter,
  searchLimiter,
  passwordResetLimiter,
  webhookLimiter,
  createUpdateLimiter,
  deleteLimiter,
};

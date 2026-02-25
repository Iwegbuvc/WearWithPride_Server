require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./db/config");
const authRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paystackWebhook = require("./controllers/paystack/paystackwebhookController");
const checkoutRoutes = require("./routes/checkoutRoutes");

const app = express();
//  Fix for Express behind a proxy (Render)
app.set("trust proxy", 1);

connectDB();

// Parse Paystack webhook first (needs raw body)
app.post(
  "/api/checkout/paystack/webhook",
  express.raw({ type: "application/json" }),
  paystackWebhook,
);

app.use(express.json());
app.use(cookieParser());

// 🔹 CORS config
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5174",
  "https://wear-with-pride.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (curl, Postman, mobile apps)
      if (!origin) return callback(null, true);

      // Match origin ignoring trailing slash
      if (allowedOrigins.some((o) => origin.startsWith(o))) {
        callback(null, true);
      } else {
        console.warn("Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.get("/", (req, res) => {
  res.send("Welcome to Wear-With-Pride Platform");
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/checkout", checkoutRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

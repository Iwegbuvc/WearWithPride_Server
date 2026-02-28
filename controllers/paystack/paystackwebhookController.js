const crypto = require("crypto");
const Order = require("../../models/orderModel");
const Product = require("../../models/productModel");
const Cart = require("../../models/cartModel");

const paystackWebhook = async (req, res) => {
  try {
    // 1️⃣ Verify Paystack signature
    const secret = process.env.PAYSTACK_SECRET_KEY;

    const hash = crypto
      .createHmac("sha512", secret)
      .update(req.body) // Use the raw buffer for signature verification
      .digest("hex");

    console.log("[Paystack Webhook] Computed hash:", hash);
    console.log("[Paystack Webhook] Received signature:", req.headers["x-paystack-signature"]);
    // Print the raw buffer as a string for debugging
    try {
      console.log("[Paystack Webhook] Event body (raw):", req.body.toString());
    } catch (e) {
      console.log("[Paystack Webhook] Could not print raw body");
    }

    if (hash !== req.headers["x-paystack-signature"]) {
      console.error("[Paystack Webhook] Signature mismatch");
      return res.status(401).send("Invalid signature");
    }

    // Parse the raw buffer to JSON
    let event;
    try {
      event = JSON.parse(req.body.toString());
    } catch (e) {
      console.error("[Paystack Webhook] Failed to parse event body as JSON");
      return res.sendStatus(400);
    }

    // 2️⃣ Handle successful payment
    if (event.event === "charge.success") {
      const { reference, metadata } = event.data;
      const orderId = metadata?.orderId;

      console.log("[Paystack Webhook] charge.success for orderId:", orderId);

      if (!orderId) {
        console.error("[Paystack Webhook] No orderId in metadata");
        return res.sendStatus(200);
      }

      const order = await Order.findById(orderId);
      if (!order) {
        console.error("[Paystack Webhook] Order not found for orderId:", orderId);
        return res.sendStatus(200);
      }
      if (order.paymentStatus === "paid") {
        console.log("[Paystack Webhook] Order already marked as paid:", orderId);
        return res.sendStatus(200);
      }

      // 3️⃣ Mark order as paid
      order.paymentStatus = "paid";
      order.paymentReference = reference;
      order.paidAt = new Date();
      await order.save();
      console.log("[Paystack Webhook] Order marked as paid:", orderId);

      // 4️⃣ Reduce stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }
      console.log("[Paystack Webhook] Stock reduced for order:", orderId);

      // 5️⃣ Clear cart
      await Cart.findOneAndDelete({ user: order.user });
      console.log("[Paystack Webhook] Cart cleared for user:", order.user);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error);
    res.sendStatus(500);
  }
};

module.exports = paystackWebhook;

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
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).send("Invalid signature");
    }

    const event = req.body;

    // 2️⃣ Handle successful payment
    if (event.event === "charge.success") {
      const { reference, metadata } = event.data;
      const orderId = metadata?.orderId;

      if (!orderId) return res.sendStatus(200);

      const order = await Order.findById(orderId);
      if (!order || order.paymentStatus === "paid") {
        return res.sendStatus(200);
      }

      // 3️⃣ Mark order as paid
      order.paymentStatus = "paid";
      order.paymentReference = reference;
      order.paidAt = new Date();
      await order.save();

      // 4️⃣ Reduce stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }

      // 5️⃣ Clear cart
      await Cart.findOneAndDelete({ user: order.user });
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error.message);
    res.sendStatus(500);
  }
};

module.exports = paystackWebhook;

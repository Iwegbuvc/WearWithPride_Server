const crypto = require("crypto");
const Cart = require("../../models/cartModel");
const Order = require("../../models/orderModel");
const Product = require("../../models/productModel");
const axios = require("axios");

// ✅ Utility functions
const calculateCartTotal = (items) => {
  return items.reduce((total, item) => {
    return total + item.priceAtTime * item.quantity;
  }, 0);
};

const mapOrderToFrontend = (order) => ({
  id: order._id,
  user: order.user,
  items: order.items.map((item) => ({
    product: item.product,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    size: item.size,
    image: item.image,
  })),
  shippingAddress: order.shippingAddress,
  totalAmount: order.totalAmount,
  paymentStatus: order.paymentStatus,
  paidAt: order.paidAt,
});

const createCheckout = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product",
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Stock validation
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for ${item.product.name}`,
        });
      }
    }

    const totalAmount = calculateCartTotal(cart.items);

    const paymentMethod = req.body.paymentMethod || "Paystack";
    const order = await Order.create({
      user: req.user.id,
      items: cart.items.map((item) => ({
        product: item.product._id,
        name: item.product.name,
        price: item.priceAtTime,
        quantity: item.quantity,
        size: item.size,
        image: item.product.images[0]?.url,
        selectedImage: item.selectedImage,
      })),
      shippingAddress: req.body.shippingAddress,
      totalAmount,
      paymentStatus:
        paymentMethod === "Pay on Delivery" ? "Not Paid" : "pending",
      paymentMethod,
    });

    res.status(201).json({
      orderId: order._id,
      amount: order.totalAmount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const initializePayment = async (req, res) => {
  try {
    const { orderId, email } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({ message: "Order already paid" });
    }

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: order.totalAmount * 100, // Paystack uses kobo
        reference: `order_${order._id}_${Date.now()}`,
        metadata: {
          orderId: order._id.toString(),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    res.json({
      authorizationUrl: response.data.data.authorization_url,
      reference: response.data.data.reference,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ message: "Payment initialization failed" });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { reference, orderId } = req.body;

    console.log("Paystack secret key:", process.env.PAYSTACK_SECRET_KEY);

    // 1️⃣ Find the order first
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // 2️⃣ If already paid, return the order without processing again
    if (order.paymentStatus === "paid") {
      return res.json({
        message: "Payment already verified",
        order: mapOrderToFrontend(order),
      });
    }

    // 3️⃣ Verify transaction with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      },
    );

    if (!response.data.status) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // 4️⃣ Mark order as paid
    order.paymentStatus = "paid";
    order.paymentReference = reference;
    order.paidAt = new Date();
    await order.save();

    // 5️⃣ Reduce product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // 6️⃣ Clear user's cart
    await Cart.findOneAndDelete({ user: order.user });

    // 7️⃣ Return the cleaned-up order
    res.json({
      message: "Payment verified",
      order: mapOrderToFrontend(order),
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ message: "Payment verification failed" });
  }
};

module.exports = {
  createCheckout,
  initializePayment,
  verifyPayment,
};

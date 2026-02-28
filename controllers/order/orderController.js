const Order = require("../../models/orderModel");

// 🔁 reuse your mapper
const mapOrderToFrontend = (order) => ({
  _id: order._id,
  createdAt: order.createdAt,
  isPaid: order.paymentStatus === "paid",
  paymentStatus: order.paymentStatus,
  paymentMethod: order.paymentMethod || "Paystack",
  orderStatus: order.orderStatus, // Add orderStatus field
  shippingAddress: {
    address: order.shippingAddress.address,
    city: order.shippingAddress.city,
    country: order.shippingAddress.country,
  },
  orderItems: order.items.map((item) => ({
    productId: item.product,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    size: item.size,
    image: item.image || "",
    selectedImage: item.selectedImage || "",
    color: item.color || "",
  })),
  totalPrice: order.totalAmount,
});

// ✅ Get logged-in user's orders (Order History)
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    res.json(orders.map(mapOrderToFrontend));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Get single order
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(mapOrderToFrontend(order));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMyOrders,
  getOrderById,
};

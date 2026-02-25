const Cart = require("../../models/cartModel");
const Product = require("../../models/productModel");

// Utility to recalculate total
const calculateTotal = (items) =>
  items.reduce((sum, item) => sum + item.priceAtTime * item.quantity, 0);

// GET USER CART
const getCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id }).populate(
    "items.product",
  );

  if (!cart) {
    return res.json({ items: [], totalPrice: 0 });
  }

  res.json(cart);
};

// ADD TO CART
const addToCart = async (req, res) => {
  const { productId, quantity = 1, size, color, selectedImage } = req.body;

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: "Product not found" });

  // Use salePrice if available, otherwise use price
  const priceToUse =
    typeof product.salePrice === "number" && product.salePrice > 0
      ? product.salePrice
      : product.price;

  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    cart = new Cart({ user: req.user.id, items: [] });
  }

  const existingItem = cart.items.find(
    (item) =>
      item.product.toString() === productId &&
      item.size === size &&
      item.color === color,
    item.selectedImage === selectedImage,
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({
      product: product._id,
      quantity,
      size,
      color,
      priceAtTime: priceToUse,
      selectedImage,
    });
  }

  cart.totalPrice = calculateTotal(cart.items);
  await cart.save();

  res.status(200).json(cart);
};

const updateCartItem = async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  const cart = await Cart.findOne({ user: req.user.id }).populate(
    "items.product",
  ); // <--- populate
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  const item = cart.items.id(itemId);
  if (!item) return res.status(404).json({ message: "Item not found" });

  item.quantity = quantity;
  cart.totalPrice = calculateTotal(cart.items);

  await cart.save();
  res.json(cart); // now items.product has full object with images & name
};

// REMOVE ITEM
const removeCartItem = async (req, res) => {
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
  cart.totalPrice = calculateTotal(cart.items);

  await cart.save();
  res.json(cart);
};

// CLEAR CART (used after checkout)
const clearCart = async (req, res) => {
  await Cart.findOneAndDelete({ user: req.user.id });
  res.json({ message: "Cart cleared" });
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};

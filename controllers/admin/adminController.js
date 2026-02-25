const { imageUploadUtil } = require("../../config/cloudinaryUpload");
const cloudinary = require("cloudinary").v2;
const Feature = require("../../models/featureModel");
const Product = require("../../models/productModel");
const User = require("../../models/usersModel");

// GET ALL USERS (Admin) with pagination, filters & search
const getAllUsers = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 🔍 Build filters
    const filter = {};

    // Filter by role
    if (req.query.role) {
      filter.role = req.query.role; // user | admin
    }

    // Filter by status
    if (req.query.status) {
      filter.status = req.query.status; // Active | Blocked
    }

    // Search by name or email
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // 👥 Fetch users
    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // 📊 Count for pagination
    const totalUsers = await User.countDocuments(filter);

    res.json({
      page,
      limit,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      users,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

// TOGGLE USER STATUS (Active / Blocked)
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = user.status === "Active" ? "Blocked" : "Active";
    await user.save();

    res.json({ message: "User status updated", status: user.status });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};
// Admin Controller for managing homepage images and products
const addFeatureImage = async (req, res) => {
  try {
    // req.file.buffer contains the image file
    const result = await imageUploadUtil(req.file.buffer);
    if (!result || !result.secure_url) {
      return res
        .status(500)
        .json({ success: false, message: "Image upload failed" });
    }
    const featureImages = new Feature({
      image: result.secure_url, // Cloudinary image URL
    });
    await featureImages.save();
    res.status(201).json({
      success: true,
      data: featureImages,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};
// Get all homepage feature images
const getFeatureImages = async (req, res) => {
  try {
    const images = await Feature.find({});

    res.status(200).json({
      success: true,
      data: images,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};
// Upload for Products
const createProduct = async (req, res) => {
  try {
    const { name, description, price, salePrice, totalStock, category, sizes } =
      req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Images are required" });
    }

    // Upload images to Cloudinary & delete temp files
    const images = await Promise.all(
      req.files.map(async (file) => {
        const result = await imageUploadUtil(file.buffer);

        return {
          url: result.secure_url,
          altText: name,
        };
      }),
    );

    const product = await Product.create({
      name,
      description,
      price,
      salePrice,
      totalStock,
      category,
      sizes: Array.isArray(sizes) ? sizes : sizes ? sizes.split(",") : [],
      images,
    });

    res.status(201).json(product);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
// GET PRODUCTS WITH FILTERS & PAGINATION
const getProducts = async (req, res) => {
  try {
    const { category, sizes, price, search, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (sizes)
      filter.sizes = { $in: Array.isArray(sizes) ? sizes : sizes.split(",") };
    if (price) filter.price = { $lte: parseFloat(price) };

    // 🔍 SEARCH LOGIC (use MongoDB text index for better results)
    if (search && search.trim() !== "") {
      filter.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
// UPDATE PRODUCT
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const { name, description, price, salePrice, totalStock, category, sizes } =
      req.body;

    const updateData = {
      name: name ?? existingProduct.name,
      description: description ?? existingProduct.description,
      price: price ?? existingProduct.price,
      salePrice: salePrice ?? existingProduct.salePrice,
      totalStock: totalStock ?? existingProduct.totalStock,
      category: category ?? existingProduct.category,
    };

    if (sizes !== undefined) {
      updateData.sizes = Array.isArray(sizes)
        ? sizes
        : sizes
          ? sizes.split(",")
          : [];
    }

    // Handle image uploads (memory storage)
    if (req.files && req.files.length > 0) {
      // Optionally delete old images from Cloudinary
      for (const img of existingProduct.images) {
        const urlParts = img.url.split("/");
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExtension.split(".")[0];
        await cloudinary.uploader.destroy(`WearWithPride/products/${publicId}`);
      }

      const images = await Promise.all(
        req.files.map(async (file) => {
          const result = await imageUploadUtil(file.buffer);
          return {
            url: result.secure_url,
            altText: name || existingProduct.name,
          };
        }),
      );
      updateData.images = images;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: "after", runValidators: true },
    );

    res.json(updatedProduct);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
// DELETE PRODUCT
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete images from Cloudinary
    for (const img of product.images) {
      const urlParts = img.url.split("/");
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      const publicId = publicIdWithExtension.split(".")[0];
      await cloudinary.uploader.destroy(`WearWithPride/products/${publicId}`);
    }

    await product.deleteOne();
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
// Get single product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 🔍 Build filters dynamically
    const filter = {};

    // Filter by payment method
    if (req.query.paymentMethod) {
      filter.paymentMethod = req.query.paymentMethod; // Paystack | Pay on Delivery
    }

    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus; // paid | pending | failed
    }

    if (req.query.orderStatus) {
      filter.orderStatus = req.query.orderStatus; // processing | shipped | delivered | cancelled
    }

    // 📦 Query orders and populate items.product (with selectedImage in items)
    const orders = await Order.find(filter)
      .populate("user", "name email")
      .populate("items.product", "name images price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Add paymentMethod and mapped paymentStatus for frontend clarity
    const ordersWithPayment = orders.map((order) => {
      let mappedPaymentStatus = order.paymentStatus;
      if (
        order.paymentMethod === "Pay on Delivery" &&
        order.paymentStatus !== "paid"
      ) {
        mappedPaymentStatus = "Not Paid";
      } else if (
        order.paymentMethod === "Paystack" &&
        order.paymentStatus !== "paid"
      ) {
        mappedPaymentStatus = "Pending";
      }

      // If items exist, include selectedImage in each item
      let cartItems = [];
      if (order.items && Array.isArray(order.items)) {
        cartItems = order.items.map((item) => ({
          ...item,
          selectedImage: item.selectedImage,
        }));
      }

      return {
        ...order,
        paymentMethod: order.paymentMethod || "Paystack",
        paymentStatus: mappedPaymentStatus,
        cartItems, // expose cart items with selectedImage
      };
    });

    // 📊 Total count (for pagination)
    const totalOrders = await Order.countDocuments(filter);

    res.json({
      page,
      limit,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      orders: ordersWithPayment,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

// UPDATE ORDER STATUS
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["processing", "shipped", "delivered", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.orderStatus = status;

    if (status === "shipped") {
      order.shippedAt = new Date();
    }

    if (status === "delivered") {
      order.deliveredAt = new Date();
    }

    await order.save();

    res.json({
      message: "Order status updated",
      orderStatus: order.orderStatus,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllUsers,
  toggleUserStatus,
  addFeatureImage,
  getFeatureImages,
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
};

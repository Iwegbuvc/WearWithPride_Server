const express = require("express");
const router = express.Router();
const {
  addFeatureImage,
  getFeatureImages,
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  getProductById,
  getAllUsers,
  toggleUserStatus,
  updateOrderStatus,
  getAllOrders,
} = require("../controllers/admin/adminController");
const { verifyToken, isAdmin } = require("../middleware/validateToken");
const { upload } = require("../config/cloudinaryUpload");
const { adminLimiter } = require("../middleware/rateLimiter");

router.get("/getAllUsers", verifyToken, isAdmin, adminLimiter, getAllUsers);
router.put(
  "/toggleUserStatus/:id",
  verifyToken,
  isAdmin,
  adminLimiter,
  toggleUserStatus,
);
router.post(
  "/addHomePageImage",
  verifyToken,
  isAdmin,
  adminLimiter,
  upload.single("image"),
  addFeatureImage,
);
router.get("/getHomePageImages", getFeatureImages);
router.post(
  "/createProduct",
  verifyToken,
  isAdmin,
  adminLimiter,
  upload.array("images", 5),
  createProduct,
);
router.get("/getProducts", getProducts);
router.put(
  "/updateProduct/:id",
  verifyToken,
  isAdmin,
  adminLimiter,
  upload.array("images", 5),
  updateProduct,
);
// ORDERS
router.get("/orders", verifyToken, isAdmin, adminLimiter, getAllOrders);
router.patch(
  "/orders/:id/status",
  verifyToken,
  isAdmin,
  adminLimiter,
  updateOrderStatus,
);

router.delete(
  "/deleteProduct/:id",
  verifyToken,
  isAdmin,
  adminLimiter,
  deleteProduct,
);
router.get("/getProduct/:id", getProductById);
module.exports = router;

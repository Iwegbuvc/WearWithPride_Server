const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  url: String,
  altText: String,
});

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "accessories",
        "shirts",
        "jackets",
        "trousers/shorts",
        "shoes",
        "combo",
      ],
      required: true,
    },
    price: { type: Number, required: true },
    salePrice: { type: Number },
    totalStock: { type: Number, required: true },
    sizes: {
      type: [String],
      default: [],
    },
    images: {
      type: [imageSchema],
      required: true,
    },
  },
  { timestamps: true },
);

// Add text index for search functionality
ProductSchema.index({ name: "text", description: "text", category: "text" });

module.exports = mongoose.model("Product", ProductSchema);

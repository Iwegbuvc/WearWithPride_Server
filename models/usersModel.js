const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    resetPasswordToken: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    status: {
      type: String,
      enum: ["Active", "Blocked"],
      default: "Active",
    },
    refreshToken: { type: [String], default: [] }, // Array for refresh tokens
  },
  { timestamps: true },
);

// const User = mongoose.model("User", userSchema);
const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;

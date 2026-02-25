const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/usersModel");
const BlacklistedToken = require("../../models/blackListTokenModel"); // Needed for logout
const {
  forgotPasswordMail,
  generatePasswordResetMail,
} = require("../../utilities/mailGenerator");
const sendMail = require("../../utilities/sendMail");

// Helper to generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
};
// REGISTER USER
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });

    const refreshToken = generateRefreshToken(newUser._id);
    newUser.refreshToken = refreshToken;
    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" },
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production" ||
        process.env.NODE_ENV === "staging",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 🔥 BLOCKED USER CHECK
    if (user.status === "Blocked") {
      return res.status(403).json({
        message: "Your account has been blocked. Contact support.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" },
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production" ||
        process.env.NODE_ENV === "staging",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "User login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// REFRESH TOKEN ENDPOINT
const handleRefreshToken = async (req, res) => {
  // 1. Check for Refresh Token in Cookies
  const cookies = req.cookies;
  if (!cookies?.refreshToken) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Refresh Token Missing" });
  }
  const refreshToken = cookies.refreshToken; // This is the OLD/INCOMING refresh token

  // 2. Find the User with the Refresh Token in the Database
  try {
    // Find a user who has this specific token in their 'refreshToken' array
    const foundUser = await User.findOne({ refreshToken: refreshToken }).exec();

    // Check 2a: Was the token found in the database?
    if (!foundUser) {
      // This is the critical security check for a token used after logout/theft.
      return res
        .status(403)
        .json({ message: "Forbidden: Invalid Refresh Token" });
    }

    // 3. Verify the JWT Signature and Expiration
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err || foundUser._id.toString() !== decoded.id) {
          // Clear ALL refresh tokens for this user because this one was replayed or tampered with
          console.error(
            `SECURITY ALERT: Token verification failed for user ID ${foundUser._id}. Wiping all tokens.`,
          );
          foundUser.refreshToken = [];
          await foundUser.save();

          return res
            .status(403)
            .json({ message: "Forbidden: Token Verification Failed" });
        }

        // ----------------------------------------------------
        // 🚀 START OF NEW ROTATION LOGIC 🚀
        // ----------------------------------------------------

        // 4a. Generate a NEW Refresh Token
        const newRefreshToken = jwt.sign(
          { id: foundUser._id, email: foundUser.email },
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: "7d" }, // New 7-day token
        );

        // 4b. Find and remove the OLD refresh token from the database array
        foundUser.refreshToken = foundUser.refreshToken.filter(
          (token) => token !== refreshToken,
        );

        // 4c. Add the NEW refresh token to the database array and save
        foundUser.refreshToken.push(newRefreshToken);
        await foundUser.save(); // 👈 This MUST be awaited!

        // 4d. Generate the new Access Token (short life)
        const newAccessToken = jwt.sign(
          { id: foundUser._id, email: foundUser.email },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "1h" },
        );

        // 4e. Blacklist the old access token if provided in the request header
        const oldAccessTokenHeader = req.headers["authorization"];
        if (
          oldAccessTokenHeader &&
          oldAccessTokenHeader.startsWith("Bearer ")
        ) {
          const oldAccessToken = oldAccessTokenHeader.split(" ")[1];
          try {
            // Decode to get expiry
            const decoded = jwt.decode(oldAccessToken);
            if (decoded && decoded.exp) {
              const expiresAt = new Date(decoded.exp * 1000);
              await BlacklistedToken.create({
                token: oldAccessToken,
                expiresAt,
              });
            }
          } catch (err) {
            console.warn("Failed to blacklist old access token:", err);
          }
        }

        // 5. Send the NEW Refresh Token in a cookie (and the new Access Token)
        res.cookie("refreshToken", newRefreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: "/",
        });

        res.status(200).json({ accessToken: newAccessToken });

        //  END OF NEW ROTATION LOGIC
      },
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Enter your email" });
  }

  try {
    const foundUser = await User.findOne({ email });
    if (!foundUser) {
      // For extra security, you may want to always return success here
      return res.status(404).json({ message: "User does not exist" });
    }

    // Generate reset token (JWT)
    const resetToken = jwt.sign(
      { email: foundUser.email },
      process.env.PASSWORD_RESET_TOKEN,
      { expiresIn: "1h" },
    );

    // Save token in DB
    foundUser.resetPasswordToken = resetToken;
    await foundUser.save();

    // Send email
    const html = forgotPasswordMail(foundUser.name || "Customer", resetToken);
    await sendMail(
      foundUser.email,
      "Reset Your Password - WearWithPride",
      html,
    );

    return res
      .status(200)
      .json({ message: "Reset password link sent successfully", email });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  const { resetToken, password } = req.body;

  if (!resetToken || !password) {
    return res.status(400).json({
      message: "Enter required fields",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(resetToken, process.env.PASSWORD_RESET_TOKEN);

    // Find user by token
    const foundUser = await User.findOne({
      email: decoded.email,
      resetPasswordToken: resetToken,
    });

    if (!foundUser) {
      return res
        .status(401)
        .json({ message: "Invalid or expired reset token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Prevent reusing old password
    const isSamePassword = await bcrypt.compare(password, foundUser.password);
    if (isSamePassword) {
      return res.status(400).json({
        message: "New password cannot be the same as the old password",
      });
    }

    // Update password & clear reset token
    foundUser.password = hashedPassword;
    foundUser.resetPasswordToken = null;
    await foundUser.save();

    // Send confirmation email
    const html = generatePasswordResetMail(foundUser.name || "Customer");
    await sendMail(foundUser.email, "Password Reset - WearWithPride", html);

    return res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET PROFILE (protected)
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      message: "Profile fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// LOGOUT USER (protected)
const logoutUser = async (req, res) => {
  const cookies = req.cookies;
  const authHeader = req.headers.authorization || "";
  const accessToken = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  // Blacklist access token
  if (accessToken) {
    try {
      const decoded = jwt.decode(accessToken);
      if (decoded?.exp) {
        await BlacklistedToken.create({
          token: accessToken,
          expiresAt: new Date(decoded.exp * 1000),
        });
      }
    } catch (err) {
      console.error("Access Token Blacklist Error:", err);
    }
  }

  // Remove refresh token from DB
  if (cookies?.refreshToken) {
    try {
      await User.updateOne(
        { refreshToken: cookies.refreshToken },
        { $pull: { refreshToken: cookies.refreshToken } },
      );
    } catch (err) {
      console.error("Refresh Token DB Cleanup Error:", err);
    }
  }

  // Clear refresh token cookie
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production" ||
      process.env.NODE_ENV === "staging",
    sameSite: "strict",
  });

  return res.status(204).send(); // Logout successful
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  logoutUser,
  handleRefreshToken,
  forgotPassword,
  resetPassword,
};

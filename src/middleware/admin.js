
const User = require("../models/User");

const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Please log in again.",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin permission required.",
      });
    }

    next();
  } catch (error) {
    console.error("Admin Middleware Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify admin permission.",
    });
  }
};

module.exports = adminMiddleware;


const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const User = require("../models/User");

async function makeAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    if (!process.env.MONGODB_URI || !adminEmail) {
      throw new Error("MONGODB_URI or ADMIN_EMAIL is missing in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB Connected Successfully!");

    const user = await User.findOne({ email: adminEmail });

    if (!user) {
      console.log("No account found with ADMIN_EMAIL.");
      console.log("Please sign up using that email first.");
      return;
    }

    if (user.role === "admin") {
      console.log("This account is already an Admin.");
      return;
    }

    user.role = "admin";
    await user.save();

    console.log("Admin account created successfully!");
    console.log("Admin Email:", user.email);
    console.log("Role:", user.role);
  } catch (error) {
    console.error("Admin Setup Error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

makeAdmin();

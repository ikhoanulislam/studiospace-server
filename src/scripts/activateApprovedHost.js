
require("dotenv").config();
const mongoose = require("mongoose");

const User = require("../models/User");
const HostApplication = require("../models/HostApplication");

const activateApprovedHost = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const email = "ikhoanulislam@gmail.com";

    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("User account not found.");
    }

    const application = await HostApplication.findOne({
      userId: user._id,
      status: "approved",
    });

    if (!application) {
      throw new Error("No approved host application found.");
    }

    user.isHost = true;

    await user.save();

    console.log("Host permission activated successfully!");
    console.log("User:", user.name);
    console.log("Email:", user.email);
    console.log("Role:", user.role);
    console.log("isHost:", user.isHost);
  } catch (error) {
    console.error("Activation Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

activateApprovedHost();

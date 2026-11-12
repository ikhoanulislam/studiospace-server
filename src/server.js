const { OAuth2Client } = require("google-auth-library");

const cookieParser = require("cookie-parser");

const express = require("express");

const mongoose = require("mongoose");

const dotenv = require("dotenv");

const cors = require("cors");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();

const Studio = require("./models/Studio");

const Booking = require("./models/Booking");

const User = require("./models/User");

const Contact = require("./models/Contact");

const HostApplication = require("./models/HostApplication");

const authMiddleware = require("./middleware/auth");

const adminMiddleware = require("./middleware/admin");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

app.use(cookieParser());

// ==========================================
// HELPERS
// ==========================================

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing.");
  }

  return jwt.sign(
    { userId: userId.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar || "",
  role: user.role,
  isHost: user.isHost || false,
});

// Set JWT in an HTTPOnly cookie
const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
};

// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "StudioSpace API is running!",
  });
});

// ==========================================
// USER SIGNUP
// ==========================================

app.get("/api/health", (req, res) => {
  const isDatabaseConnected = mongoose.connection.readyState === 1;

  return res.status(isDatabaseConnected ? 200 : 503).json({
    success: isDatabaseConnected,
    server: "running",
    database: isDatabaseConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully!",
      data: formatUser(user),
    });
  } catch (error) {
    console.error("Signup Error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
});

// ==========================================
// USER LOGIN
// ==========================================

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user._id);

    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      data: formatUser(user),
    });
  } catch (error) {
    console.error("Login Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
});

// ==========================================
// GOOGLE LOGIN
// ==========================================

app.post("/api/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required.",
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: "Google Client ID is missing.",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (
      !payload ||
      !payload.sub ||
      !payload.email ||
      payload.email_verified !== true
    ) {
      return res.status(401).json({
        success: false,
        message: "Google account verification failed.",
      });
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();
    const name = payload.name || email.split("@")[0];
    const avatar = payload.picture || "";

    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.findOne({ email });

      if (user) {
        user.googleId = googleId;
        user.avatar = avatar;
        await user.save();
      } else {
        user = await User.create({
          name,
          email,
          googleId,
          avatar,
        });
      }
    }

    const token = generateToken(user._id);

    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Google login successful!",
      token,
      data: formatUser(user),
    });
  } catch (error) {
    console.error("Google Login Error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Google authentication failed. Please try again.",
    });
  }
});

// ==========================================
// USER LOGOUT
// ==========================================

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

// ==========================================
// GET CURRENT USER
// ==========================================

app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: formatUser(user),
    });
  } catch (error) {
    console.error("Get User Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
});

// ==========================================
// UPDATE USER PROFILE
// ==========================================

app.put("/api/auth/profile", authMiddleware, async (req, res) => {
  try {
    const { name, avatar } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty.",
        });
      }

      user.name = name.trim();
    }

    if (avatar !== undefined) {
      if (typeof avatar !== "string" || avatar.length > 2000) {
        return res.status(400).json({
          success: false,
          message: "Invalid profile image URL.",
        });
      }

      user.avatar = avatar.trim();
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      data: formatUser(user),
    });
  } catch (error) {
    console.error("Profile Update Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
});

// ==========================================
// GET ALL STUDIOS
// ==========================================

app.get("/api/studios", async (req, res) => {
  try {
    const studios = await Studio.find();

    return res.status(200).json({
      success: true,
      total: studios.length,
      data: studios,
    });
  } catch (error) {
    console.error("Get Studios Error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// CREATE NEW STUDIO
// ==========================================

app.post("/api/studios", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      category,
      location,
      price,
      securityDeposit,
      capacity,
      amenities,
      image,
      description,
    } = req.body;

    // Validate required fields
    if (
      !name?.trim() ||
      !category?.trim() ||
      !location?.trim() ||
      price === undefined ||
      Number(price) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required studio details.",
      });
    }

    // Find logged-in user
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Check host permission
    if (user.isHost !== true && user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only approved hosts can add studios.",
      });
    }

    // Save studio in MongoDB
    const studio = await Studio.create({
      id: `studio-${Date.now()}`,
      name: name.trim(),
      category: category.trim(),
      location: location.trim(),
      price: Number(price),
      securityDeposit: Number(securityDeposit) || 0,
      capacity: Number(capacity) || 1,
      amenities: Array.isArray(amenities) ? amenities : [],
      image: image || "",
      description: description || "",
      hostId: user._id,
      hostName: user.name,
      hostEmail: user.email,
    });

    return res.status(201).json({
      success: true,
      message: "Studio added successfully!",
      data: studio,
    });
  } catch (error) {
    console.error("Create Studio Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to add studio.",
    });
  }
});

// ==========================================
// GET MY STUDIO LISTINGS
// ==========================================

app.get("/api/my-studios", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const studios = await Studio.find({
      hostId: user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: studios.length,
      data: studios,
    });
  } catch (error) {
    console.error("My Studios Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load your studios.",
    });
  }
});

// ==========================================
// UPDATE STUDIO
// ==========================================

app.put("/api/studios/:id", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      category,
      location,
      price,
      securityDeposit,
      capacity,
      amenities,
      image,
      description,
    } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const studio = await Studio.findOne({
      id: req.params.id,
    });

    if (!studio) {
      return res.status(404).json({
        success: false,
        message: "Studio not found.",
      });
    }

    // Only the studio owner or admin can update
    if (
      studio.hostId.toString() !== user._id.toString() &&
      user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this studio.",
      });
    }

    if (name !== undefined) studio.name = name.trim();
    if (category !== undefined) studio.category = category.trim();
    if (location !== undefined) studio.location = location.trim();
    if (price !== undefined) studio.price = Number(price);

    if (securityDeposit !== undefined) {
      studio.securityDeposit = Number(securityDeposit);
    }

    if (capacity !== undefined) studio.capacity = Number(capacity);
    if (amenities !== undefined) studio.amenities = amenities;
    if (image !== undefined) studio.image = image;
    if (description !== undefined) studio.description = description;

    await studio.save();

    return res.status(200).json({
      success: true,
      message: "Studio updated successfully!",
      data: studio,
    });
  } catch (error) {
    console.error("Update Studio Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update studio.",
    });
  }
});

// ==========================================
// DELETE STUDIO
// ==========================================

app.delete("/api/studios/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const studio = await Studio.findOne({
      id: req.params.id,
    });

    if (!studio) {
      return res.status(404).json({
        success: false,
        message: "Studio not found.",
      });
    }

    // Only owner or admin can delete
    if (
      studio.hostId.toString() !== user._id.toString() &&
      user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this studio.",
      });
    }

    await Studio.deleteOne({ _id: studio._id });

    return res.status(200).json({
      success: true,
      message: "Studio deleted successfully!",
    });
  } catch (error) {
    console.error("Delete Studio Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete studio.",
    });
  }
});

// ==========================================
// GET SINGLE STUDIO
// ==========================================

app.get("/api/studios/:id", async (req, res) => {
  try {
    const studio = await Studio.findOne({
      id: req.params.id,
    });

    if (!studio) {
      return res.status(404).json({
        success: false,
        message: "Studio not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: studio,
    });
  } catch (error) {
    console.error("Get Studio Error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================


// ==========================================
// CREATE BOOKING WITH DOUBLE BOOKING CHECK
// ==========================================

app.post("/api/bookings", authMiddleware, async (req, res) => {
  try {
    const {
      studioId,
      studioName,
      bookingDate,
      bookingTime,
      price,
    } = req.body;

    if (
      !studioId ||
      !studioName ||
      !bookingDate ||
      !bookingTime ||
      price === undefined ||
      Number(price) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all valid booking details.",
      });
    }

    // Check if the studio already has a confirmed booking
    const existingBooking = await Booking.findOne({
      studioId,
      bookingDate,
      bookingTime,
      status: "confirmed",
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message:
          "This studio is already booked for the selected date and time. Please choose another time.",
      });
    }

    // Create booking with pending status
    const booking = await Booking.create({
      userId: req.userId,
      studioId,
      studioName,
      bookingDate,
      bookingTime,
      price: Number(price),
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Booking request submitted successfully!",
      data: booking,
    });
  } catch (error) {
    console.error("Create Booking Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create booking. Please try again.",
    });
  }
});


// ==========================================
// GET MY BOOKINGS
// ==========================================

app.get("/api/bookings", authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({
      userId: req.userId,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      total: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Get Bookings Error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// CANCEL MY BOOKING
// ==========================================

app.patch(
  "/api/bookings/:id/cancel",
  authMiddleware,
  async (req, res) => {
    try {
      const booking = await Booking.findOne({
        _id: req.params.id,
        userId: req.userId,
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found.",
        });
      }

      if (booking.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Only pending bookings can be cancelled.",
        });
      }

      booking.status = "cancelled";
      await booking.save();

      return res.status(200).json({
        success: true,
        message: "Booking cancelled successfully!",
        data: booking,
      });
    } catch (error) {
      console.error("Cancel Booking Error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to cancel booking.",
      });
    }
  }
);

// ==========================================
// HOST - GET BOOKINGS FOR OWN STUDIOS
// ==========================================

app.get("/api/host/bookings", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.isHost !== true && user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only approved hosts can view studio bookings.",
      });
    }

    const studios = await Studio.find({
      hostId: user._id,
    }).select("id name");

    const studioIds = studios.map((studio) => studio.id);

    const bookings = await Booking.find({
      studioId: { $in: studioIds },
    })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Host Bookings Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load host bookings.",
    });
  }
});

// ==========================================

// ==========================================
// HOST - CONFIRM BOOKING WITH DOUBLE BOOKING CHECK
// ==========================================

app.patch(
  "/api/host/bookings/:id/confirm",
  authMiddleware,
  async (req, res) => {
    try {
      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      if (user.isHost !== true && user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only approved hosts can confirm bookings.",
        });
      }

      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found.",
        });
      }

      const studio = await Studio.findOne({
        id: booking.studioId,
        hostId: user._id,
      });

      if (!studio) {
        return res.status(403).json({
          success: false,
          message: "You cannot manage this booking.",
        });
      }

      if (booking.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Only pending bookings can be confirmed.",
        });
      }

      // Check for an existing confirmed booking
      const existingBooking = await Booking.findOne({
        _id: { $ne: booking._id },
        studioId: booking.studioId,
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        status: "confirmed",
      });

      if (existingBooking) {
        return res.status(409).json({
          success: false,
          message:
            "This studio is already booked for this date and time. You cannot confirm this booking.",
        });
      }

      // Confirm booking
      booking.status = "confirmed";
      await booking.save();

      return res.status(200).json({
        success: true,
        message: "Booking confirmed successfully!",
        data: booking,
      });
    } catch (error) {
      console.error("Confirm Booking Error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to confirm booking.",
      });
    }
  }
);

// ==========================================
// SUBMIT CONTACT FORM
// ==========================================

app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof subject !== "string" ||
      typeof message !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all contact details.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (
      !cleanName ||
      !cleanEmail ||
      !cleanSubject ||
      !cleanMessage
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (
      cleanName.length > 100 ||
      cleanEmail.length > 150 ||
      cleanSubject.length > 200 ||
      cleanMessage.length > 3000
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more fields exceed the allowed length.",
      });
    }

    const contact = await Contact.create({
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject,
      message: cleanMessage,
    });

    return res.status(201).json({
      success: true,
      message: "Your message has been submitted successfully!",
      data: {
        id: contact._id,
      },
    });
  } catch (error) {
    console.error("Contact Form Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to submit your message. Please try again.",
    });
  }
});

// ==========================================
// ADMIN - GET CONTACT MESSAGES
// ==========================================

app.get(
  "/api/admin/contacts",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const contacts = await Contact.find().sort({
        createdAt: -1,
      });

      return res.status(200).json({
        success: true,
        total: contacts.length,
        data: contacts,
      });
    } catch (error) {
      console.error("Admin Contacts Error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to load contact messages.",
      });
    }
  }
);

// ==========================================
// HOST APPLICATION APIs
// ==========================================

// SUBMIT HOST APPLICATION

app.post("/api/host/apply", authMiddleware, async (req, res) => {
  try {
    const {
      fullName,
      phone,
      location,
      studioType,
      experience,
      message,
    } = req.body;

    if (
      typeof fullName !== "string" ||
      typeof phone !== "string" ||
      typeof location !== "string" ||
      typeof studioType !== "string" ||
      typeof experience !== "string" ||
      typeof message !== "string" ||
      !fullName.trim() ||
      !phone.trim() ||
      !location.trim() ||
      !studioType.trim() ||
      !experience.trim() ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please complete all application fields.",
      });
    }

    if (
      fullName.length > 100 ||
      phone.length > 20 ||
      location.length > 200 ||
      studioType.length > 100 ||
      experience.length > 100 ||
      message.length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more fields exceed the allowed length.",
      });
    }

    const existingApplication = await HostApplication.findOne({
      userId: req.userId,
    });

    if (
      existingApplication &&
      existingApplication.status !== "rejected"
    ) {
      return res.status(409).json({
        success: false,
        message: `You already have a ${existingApplication.status} application.`,
        data: existingApplication,
      });
    }

    const applicationData = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      location: location.trim(),
      studioType: studioType.trim(),
      experience: experience.trim(),
      message: message.trim(),
      status: "pending",
      adminNote: "",
    };

    let application;

    if (existingApplication) {
      Object.assign(existingApplication, applicationData);
      application = await existingApplication.save();
    } else {
      application = await HostApplication.create({
        userId: req.userId,
        ...applicationData,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Host application submitted successfully!",
      data: application,
    });
  } catch (error) {
    console.error("Host Application Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to submit host application.",
    });
  }
});

// GET MY HOST APPLICATION STATUS

app.get("/api/host/application", authMiddleware, async (req, res) => {
  try {
    const application = await HostApplication.findOne({
      userId: req.userId,
    });

    return res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error("Host Status Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load application status.",
    });
  }
});

// ADMIN - GET ALL HOST APPLICATIONS

app.get(
  "/api/admin/host-applications",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const applications = await HostApplication.find()
        .populate("userId", "name email")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        total: applications.length,
        data: applications,
      });
    } catch (error) {
      console.error("Admin Host Applications Error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to load host applications.",
      });
    }
  }
);

// ==========================================
// ADMIN - APPROVE / REJECT HOST APPLICATION
// ==========================================

app.patch(
  "/api/admin/host-applications/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { status, adminNote = "" } = req.body;

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be approved or rejected.",
        });
      }

      if (
        typeof adminNote !== "string" ||
        adminNote.length > 1000
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid admin note.",
        });
      }

      const application = await HostApplication.findById(
        req.params.id
      );

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Host application not found.",
        });
      }

      const user = await User.findById(application.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Applicant account not found.",
        });
      }

      application.status = status;
      application.adminNote = adminNote.trim();

      // Host permission activation
      user.isHost = status === "approved";

      await user.save();
      await application.save();

      return res.status(200).json({
        success: true,
        message:
          status === "approved"
            ? "Application approved! Host permission activated successfully."
            : "Application rejected successfully.",
        data: {
          application,
          hostPermission: user.isHost,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Host Approval Error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to update host application.",
      });
    }
  }
);

// ==========================================
// MONGODB CONNECTION
// ==========================================

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully!");

    const PORT = process.env.PORT || 5002;

    app.listen(PORT, () => {
      console.log(`StudioSpace Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error.message);
  });
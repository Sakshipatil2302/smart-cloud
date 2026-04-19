const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendMail = require("../mailer");

// ✅ IMPORTANT: file must be models/userModel.js
const User = require("../models/userModel");


// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email & password required"
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000);

    const mailSent = await sendMail(
      email,
      "Verify your Smart Cloud account",
      `Your OTP is: ${otp}`
    );

    if (!mailSent) {
      return res.status(500).json({
        success: false,
        message: "Email send failed"
      });
    }

    const user = new User({
      email,
      passwordHash: hashedPassword,
      otp,
      isVerified: false
    });

    await user.save();

    res.json({
      success: true,
      message: "Registered successfully. OTP sent to email."
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


// ================= VERIFY OTP =================
router.post("/verify-otp", async (req, res) => {

  try {

    const { email, otp } = req.body;

    console.log("👉 EMAIL RECEIVED:", email);
    console.log("👉 OTP RECEIVED:", otp);

    const user = await User.findOne({ email });

    console.log("👉 USER FROM DB:", user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("👉 OTP IN DB:", user.otp);

    if (String(user.otp).trim() !== String(otp).trim()) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = null;

    await user.save();

    console.log("👉 AFTER SAVE:", user);

    return res.json({ message: "OTP verified successfully" });

  } catch (error) {
    console.log("OTP ERROR:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});



// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email & password required"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your account first"
      });
    }

    const match = await bcrypt.compare(password, user.passwordHash);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid password"
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        token
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;
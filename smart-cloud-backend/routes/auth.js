const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Temporary OTP storage
const otpStore = {};

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App password
  },
});

// -------------------- REGISTER --------------------
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  // Check email and password
  if (!email || !password) {
    return res.status(400).json({ message: "Email & password required" });
  }

  // Hash the password (optional if storing)
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStore[email] = { otp, createdAt: Date.now() };

  console.log(`OTP for ${email}: ${otp}`);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Smart Cloud OTP Verification",
      text: `Your OTP for Smart Cloud is: ${otp}`,
    });

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.log("Email error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// -------------------- VERIFY OTP --------------------
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!otpStore[email]) return res.status(400).json({ message: "No OTP request found" });

  // Expiration 5 min
  if (Date.now() - otpStore[email].createdAt > 5 * 60 * 1000) {
    delete otpStore[email];
    return res.status(400).json({ message: "OTP expired" });
  }

  if (parseInt(otp) !== otpStore[email].otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  delete otpStore[email];
  res.json({ message: "OTP verified successfully" });
});

module.exports = router;
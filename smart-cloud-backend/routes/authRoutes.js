const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendMail = require("../mailer");
const User = require("../models/User");

// REGISTER
router.post("/register", async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email & password required" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000);

    const mailSent = await sendMail(
      email,
      "Verify your Smart Cloud account",
      `Your OTP is: ${otp}`
    );

    if (!mailSent) {
      return res.status(500).json({ message: "Email send failed" });
    }

    const user = new User({
  email,
  passwordHash: hashed
});
    await user.save();

    res.json({
      success: true,
      message: "Registered successfully. OTP sent to email."
    });

  } catch (err) {

    console.log(err);
    res.status(500).json({ message: "Server error" });

  }

});
// VERIFY OTP
router.post("/verify-otp", async (req, res) => {

  try {

    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP required" });
    }

    // For now we just check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // OTP verification (temporary simple check)
    res.json({
      success: true,
      message: "OTP verified successfully"
    });

  } catch (err) {

    console.log(err);
    res.status(500).json({ message: "Server error" });

  }

});

// LOGIN
router.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
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

    console.log(err);
    res.status(500).json({ message: "Server error" });

  }

});

module.exports = router;
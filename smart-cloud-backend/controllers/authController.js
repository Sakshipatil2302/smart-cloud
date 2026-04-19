const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
require("dotenv").config();

// IMPORTANT: add User model
const User = require("../models/userModel");

// email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// ================= REGISTER USER =================
exports.registerUser = async (req, res) => {
  try {

    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required"
      });
    }

    // check user exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    // generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    console.log("OTP for verification:", otp);

    // send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Smart Cloud OTP Verification",
      text: `Your OTP for Smart Cloud is: ${otp}`,
    });

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // save user with OTP
    const user = new User({
      name,
      email,
      passwordHash: hashedPassword,
      otp,
      isVerified: false
    });

    await user.save();

    res.json({
      message: "OTP sent to email. Please verify account.",
      email
    });

  } catch (error) {
    console.log("REGISTER ERROR:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};


// ================= VERIFY OTP =================
exports.verifyOTP = async (req, res) => {

  try {

    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP required"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    console.log("DB OTP:", user.otp);
    console.log("INPUT OTP:", otp);

    if (String(user.otp).trim() !== String(otp).trim()) {
      return res.status(400).json({
        message: "Invalid OTP"
      });
    }

    // mark verified
    user.isVerified = true;
    user.otp = null;

    await user.save();

    res.json({
      message: "OTP verified successfully"
    });

  } catch (error) {
    console.log("OTP ERROR:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// ================= LOGIN USER =================
exports.loginUser = async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // check verification
    if (!user.isVerified) {
      return res.status(401).json({
        message: "Please verify your account first"
      });
    }

    const match = await bcrypt.compare(password, user.passwordHash);

    if (!match) {
      return res.status(401).json({
        message: "Invalid password"
      });
    }

    res.json({
      message: "Login successful"
    });

  } catch (error) {
    console.log("LOGIN ERROR:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};
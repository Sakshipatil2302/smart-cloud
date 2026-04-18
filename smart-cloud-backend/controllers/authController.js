const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
require("dotenv").config();

// email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Register user
exports.registerUser = async (req, res) => {

  const { name, email, password } = req.body;

  // generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000);

  console.log("OTP for verification:", otp);

  try {

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Smart Cloud OTP Verification",
      text: `Your OTP for Smart Cloud is: ${otp}`,
    });

    console.log("OTP email sent");

    res.json({
      message: "OTP sent to email",
      email
    });

  } catch (error) {

    console.log("Email sending error:", error);

    res.status(500).json({
      message: "Email sending failed"
    });

  }

};


// Verify OTP
exports.verifyOTP = async (req, res) => {

  res.json({
    message: "OTP verified"
  });

};


// Login user
exports.loginUser = async (req, res) => {

  const { email, password } = req.body;

  res.json({
    message: "Login successful"
  });

};
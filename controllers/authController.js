const User = require("../models/User");
const Tenant= require("../models/Tenant")
const Landlord= require("../models/Landlord")
const ServiceProvider= require("../models/ServiceProvider")
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const bcrypt = require('bcrypt');

dotenv.config();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};
// email transporter
const transporter = nodemailer.createTransport({
  service: "gmail", 
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASSWORD, 
  },
});

exports.registerUser = async (req, res) => {
  const { firstName, lastName, email, password, role, contactNumber } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      contactNumber,
    });

    // Create a corresponding document in the role-specific collection
    let roleDoc;
    switch (role) {
      case 'Landlord':
        roleDoc = await Landlord.create({ user: user._id });
        break;
      case 'Tenant':
        roleDoc = await Tenant.create({ user: user._id });
        break;
      case 'ServiceProvider':
        roleDoc = await ServiceProvider.create({ user: user._id });
        break;
      default:
        return res.status(400).json({ message: "Invalid role" });
    }

    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Register user error: ", error.message, error.stack);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ success: false, message: "User not found" });
    }

    // Compare the hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(200).json({ success: false, message: "Invalid password" });
    }

    res.status(200).json({
      success: true,
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    // Comment out the console log or log a generic error
    // console.error("Login user error: ", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



exports.logoutUser = (req, res) => {
  res.clearCookie('token'); // clear the token cookie
  res.status(200).json({ message: 'Logged out successfully' });
};
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Find the user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP and its expiration
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    // Send OTP via email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Forgot password error: ", error.message, error.stack);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Verify OTP 
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP is valid and not expired
    if (user.resetPasswordOTP !== otp || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Generate a token to be used in the password reset process
    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });

    res.status(200).json({ message: "OTP verified successfully", token });
  } catch (error) {
    console.error("OTP verification error: ", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    console.log(`Reset password token decoded for ${email}`);

    const user = await User.findOne({ email });

    if (!user) {
      console.log(`User not found for password reset with email: ${email}`);
      return res.status(404).json({ message: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log(`New hashed password for ${email}: ${hashedPassword}`);

    user.password = hashedPassword;
    await user.save();
    console.log(`Password updated successfully for ${email}`);

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset password error: ", error.message);
    res.status(500).json({ message: "Server error" });
  }
};



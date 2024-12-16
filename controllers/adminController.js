const User = require('../models/User');
const Property = require('../models/Property');
const RentPayment = require('../models/RentPayment');
const CommissionFee = require('../models/Commission');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' }); // Token expires in 15 minutes
};

// Admin Login (only login, no register)
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    console.log('Attempting to log in with email:', email);
    
    // Check if the user exists and is an admin
    const user = await User.findOne({ email });
    if (!user || user.role !== 'Admin') {
      console.log('User not found or not an admin');
      return res.status(400).json({ message: 'Not an admin or user not found' });
    }

    console.log('User found:', user);

    // Direct password comparison (no hashing)
    if (password !== user.password) {
      console.log('Invalid credentials');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    console.log('JWT token generated:', token);

    res.status(200).json({
      token,
      user: { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

// Route to get all users with pagination
const getAllUsers = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;  // Get pagination values from query params

  try {
    console.log(`Fetching users - Page: ${page}, Limit: ${limit}`);

    const users = await User.find()
      .skip((page - 1) * limit)  // Skip previous pages
      .limit(limit * 1);  // Limit the number of users per page

    const totalUsers = await User.countDocuments();  // Get the total number of users
    const totalPages = Math.ceil(totalUsers / limit);  // Calculate total pages

    console.log(`Total users: ${totalUsers}, Total Pages: ${totalPages}`);

    res.status(200).json({
      users,
      totalPages,
      currentPage: page,
      totalUsers,
    });
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// Route to get all properties with pagination
const getAllProperties = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;  // Get pagination values from query params

  try {
    console.log(`Fetching properties - Page: ${page}, Limit: ${limit}`);

    const properties = await Property.find()
      .skip((page - 1) * limit)  // Skip previous pages
      .limit(limit * 1);  // Limit the number of properties per page

    const totalProperties = await Property.countDocuments();  // Get the total number of properties
    const totalPages = Math.ceil(totalProperties / limit);  // Calculate total pages

    // Calculate the count of listed and rented properties
    const listedPropertiesCount = await Property.countDocuments({ status: 'listed' });
    const rentedPropertiesCount = await Property.countDocuments({ status: 'rented' });

   
    res.status(200).json({
      properties,
      totalPages,
      currentPage: page,
      totalProperties,
      totalListed: listedPropertiesCount || 0,   // Ensure fallback to 0 if no listed properties
      totalRented: rentedPropertiesCount || 0,   // Ensure fallback to 0 if no rented properties
      message: "Properties fetched successfully",
    });
  } catch (error) {
    console.error('Error fetching properties:', error.message);
    res.status(500).json({ message: 'Error fetching properties' });
  }
};

// Route to get all rent payments with pagination
const getAllPayments = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;  // Get pagination values from query params

  try {
    console.log(`Fetching rent payments - Page: ${page}, Limit: ${limit}`);

    // Fetch the rent payments with pagination
    const payments = await RentPayment.find()
      .skip((page - 1) * limit)  // Skip previous pages
      .limit(limit * 1)  // Limit the number of rent payments per page
      .populate('tenant', 'firstName lastName email')  // Populate tenant details
      .populate('landlord', 'firstName lastName email')  // Populate landlord details
      .populate('lease', 'propertyId')  // Populate lease details
      .exec();  // Execute the query

    // Count the total number of payments in the database
    const totalPayments = await RentPayment.countDocuments();
    const totalPages = Math.ceil(totalPayments / limit);  // Calculate total pages

    console.log(`Total Payments: ${totalPayments}, Total Pages: ${totalPages}`);

    res.status(200).json({
      payments,
      totalPages,
      currentPage: page,
      totalPayments,
    });
  } catch (error) {
    console.error('Error fetching payments:', error.message);
    res.status(500).json({ message: 'Error fetching payments' });
  }
};

// Add or Update Commission Fee
const addCommissionFee = async (req, res) => {
  const { fee } = req.body;
  console.log('rerquest recieved',req.body)

  // Validate input
  if (!fee || typeof fee !== 'number' || fee <= 0) {
    console.log('Invalid or missing fee value:', fee);
    return res.status(400).json({ message: 'Invalid or missing fee value' });
  }

  try {
    console.log('Checking if commission fee exists');

    // Check if a commission fee already exists
    let commissionFee = await CommissionFee.findOne();

    if (commissionFee) {
      console.log('Commission fee found, updating...');
      // Update existing commission fee
      commissionFee.fee = fee;
      await commissionFee.save();
      return res.status(200).json({
        message: 'Commission fee updated successfully',
        data: commissionFee,
      });
    } else {
      console.log('No commission fee found, creating new one...');
      // Create a new commission fee
      commissionFee = new CommissionFee({ fee });
      await commissionFee.save();
      return res.status(201).json({
        message: 'Commission fee added successfully',
        data: commissionFee,
      });
    }
  } catch (error) {
    console.error('Error adding or updating commission fee:', error.message);
    res.status(500).json({ message: 'Failed to add or update commission fee' });
  }
};

module.exports = { loginUser, getAllUsers, getAllProperties, getAllPayments, addCommissionFee };

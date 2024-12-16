// /routes/adminRoutes.js
const express = require('express');
const { loginUser, getAllUsers, getAllProperties, getAllPayments } = require('../controllers/adminController');
const { protect, adminProtect } = require('../middleware/authMiddleware'); 

const { addCommissionFee } = require ('../controllers/commissionController')
const router = express.Router();

// Admin login route
router.post('/login', loginUser); 

// Protected Admin Routes (Require JWT token and Admin role)
router.use(protect);
router.use(adminProtect); 

// Route to get all users (with pagination)
router.get('/manage-users', getAllUsers);

// Route to get all properties (with pagination)
router.get('/manage-properties', getAllProperties);


// Route to add a commission fee
router.post('/add', protect,addCommissionFee);


module.exports = router;

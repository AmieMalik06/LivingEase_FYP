const express = require('express');
const router = express.Router();
const {getLandlordByPropertyId}=require ('../controllers/landlordController')
const { protect } = require('../middleware/authMiddleware');

// Route to get landlord details by property ID
router.get('/property/:propertyId', protect, getLandlordByPropertyId);

module.exports = router;
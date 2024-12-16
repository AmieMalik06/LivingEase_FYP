const express = require("express");
const {
  createRating,
  getUserRatings,
  getAverageRating,RateServicePro
} = require("../controllers/ratingController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Route to create a new rating
router.post("/ratings", protect, createRating);

// Route to get ratings for a specific user (by user ID)
router.get("/ratings/:id", getUserRatings);
// Route to get average ratings for a specific user (by user ID)
router.get("/average-rating/:id", getAverageRating);
// Route to create a rating
router.post('/rateserviceprovider', protect, RateServicePro);

module.exports = router; // Export the router

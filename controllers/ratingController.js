const Rating = require('../models/Rating'); // Import the Rating model
const User = require('../models/User'); // Import the User model if needed
const MaintenanceRequest = require('../models/MaintenanceRequest'); 
const Notification = require('../models/Notification');
// Controller to create a new rating
exports.createRating = async (req, res) => {
  const { rating, review, ratedEntityId, role } = req.body;
  const reviewerId = req.user._id; // Assuming the user is authenticated and user ID is in req.user

  try {
    // Validate inputs (only rating, ratedEntityId, and role are required now)
    if (!rating || !ratedEntityId || !role) {
      return res.status(400).json({ message: "Rating, ratedEntityId, and role are required." });
    }

    // Create a new rating (if review is not provided, it will be set to null)
    const newRating = new Rating({
      rating,
      review: review || null, // If review is not provided, set it to null
      reviewerId,
      ratedEntityId,
      role,
    });

    await newRating.save();



    return res.status(201).json({ message: "Rating submitted successfully and notification sent.", newRating });
  } catch (error) {
    console.error("Error creating rating:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

// Controller to get ratings for a specific user
exports.getUserRatings = async (req, res) => {
  const userId = req.params.id; // User ID from the URL parameters

  try {
    const ratings = await Rating.find({
      $or: [
        { ratedEntityId: userId },
        { reviewerId: userId },
      ],
    })
      .populate('reviewerId', 'firstName lastName') // Populate reviewer details
      .populate('ratedEntityId', 'firstName lastName') // Populate rated entity details
      .exec();

    return res.status(200).json(ratings);
  } catch (error) {
    console.error("Error fetching ratings:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

// Controller to get the average rating of a user
exports.getAverageRating = async (req, res) => {
    const userId = req.params.id; // User ID from the URL parameters
  
    try {
      // Retrieve all ratings for the user
      const ratings = await Rating.find({ ratedEntityId: userId });
  
      // Calculate average rating
      if (ratings.length === 0) {
        return res.status(200).json({ averageRating: 0, message: "No ratings found." });
      }
  
      const totalRating = ratings.reduce((acc, rating) => acc + rating.rating, 0);
      const averageRating = totalRating / ratings.length;
  
      return res.status(200).json({
        averageRating: parseFloat(averageRating.toFixed(2)), // Return average rounded to two decimal places
        totalRatings: ratings.length,
      });
    } catch (error) {
      console.error("Error fetching average rating:", error);
      return res.status(500).json({ message: "Server error." });
    }
  };

  
  // Controller to create a new rating
  exports.RateServicePro = async (req, res) => {
    const { rating, review, ratedEntityId, role, maintenanceRequestId } = req.body;
    const reviewerId = req.user._id; // Assuming the user is authenticated and user ID is in req.user
  
    try {
      // Validate inputs (rating, ratedEntityId, role, and maintenanceRequestId are required)
      if (!rating || !ratedEntityId || !role || !maintenanceRequestId) {
        return res.status(400).json({ message: "Rating, ratedEntityId, role, and maintenanceRequestId are required." });
      }
  
      // Check if the maintenance request exists and is not already rated
      const maintenanceRequest = await MaintenanceRequest.findById(maintenanceRequestId);
      if (!maintenanceRequest) {
        return res.status(404).json({ message: "Maintenance request not found." });
      }
      if (maintenanceRequest.isRated) {
        return res.status(400).json({ message: "This service provider has already been rated for this request." });
      }
  
      // Create a new rating
      const newRating = new Rating({
        rating,
        review: review || null, // If review is not provided, set it to null
        reviewerId,
        ratedEntityId,
        role,
      });
  
      // Save the rating
      await newRating.save();
  
      // Update the maintenance request to set isRated to true
      maintenanceRequest.isRated = true;
      await maintenanceRequest.save();
  
      return res.status(201).json({ message: "Rating submitted successfully.", newRating });
    } catch (error) {
      console.error("Error creating rating:", error);
      return res.status(500).json({ message: "Server error." });
    }
  };
  
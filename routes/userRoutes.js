const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getName,
  uploadProfileImage,
  uploadImageController,
  getUserProfileImage,getUserData,updateUserProfile,getUserDetailsById
} = require('../controllers/userController');
// Route to get data for the currently authenticated user
router.get('/userData', protect, getUserData);
// Route to update user profile information, including profile image
router.put('/updateUserData', protect, uploadProfileImage, updateUserProfile);
// Route to upload a profile image
router.post('/upload-profile-image', protect, uploadProfileImage, uploadImageController);
// Route to get user details by user ID
router.get('/users/:id', getUserDetailsById);

// Route to get the user's name
router.get('/name', protect, getName);

// Route to get the user's profile image
router.get('/profile-image', protect, getUserProfileImage);

module.exports = router;

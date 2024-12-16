// routes/authRoutes.js
const express = require('express');
const { getNotificationsByUser,getUnreadNotificationsCount,markNotificationAsRead} = require('../controllers/notificationController');

const router = express.Router();
// Route to get notifications for a specific user (tenant or landlord)
router.get('/notifications/:userId', getNotificationsByUser);
router.get('/unread/:userId', getUnreadNotificationsCount);
// Add this route in your notification controller
router.patch('/:notificationId/markAsRead', markNotificationAsRead);
module.exports = router;

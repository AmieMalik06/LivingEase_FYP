const User = require("../models/User");
const Tenant= require("../models/Tenant")
const Landlord= require("../models/Landlord")
const Notification= require("../models/Notification")
// Get notifications for a tenant
exports.getNotificationsByUser = async (req, res) => {
    try {
      const notifications = await Notification.find({ userId: req.params.userId }).sort({ timestamp: -1 });
      res.status(200).json({ success: true, notifications });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications', error });
    }
  };
 exports.getUnreadNotificationsCount = async (req, res) => {
    try {
      const userId = req.params.userId;  // User ID from URL params
      const unreadCount = await Notification.countDocuments({ userId, isRead: false });
      res.json({ unreadCount });
    } catch (error) {
      console.error('Error fetching unread notifications count:', error);
      res.status(500).json({ message: 'Error fetching unread notifications' });
    }
  };

  // Endpoint to mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = req.params.notificationId;
    console.log(req.params)
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
};



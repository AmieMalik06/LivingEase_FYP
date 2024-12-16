const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
// Route to send a message
router.post(
  "/send",
  upload.array("attachments[]", 5),
  messageController.sendMessageController
);

// Route to get all messages between two users
router.get("/:senderId/:receiverId", messageController.getMessages);
//get all communicated users history
router.get(
  "/users/communicated/:userId",
  messageController.getCommunicatedUsers
);

// Route to get unread messages count for a user
router.get("/unreadCount/:senderId/:receiverId", messageController.getUnreadMessagesCount);

// Route to mark messages as read
router.post("/markAsRead", messageController.markMessagesAsRead);

module.exports = router;

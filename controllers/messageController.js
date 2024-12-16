const Message = require('../models/Message');
const User = require('../models/User');
const { getIO } = require('../socket');
const cloudinary = require("../config/cloudinary");
const multer = require("multer");

const uploader = cloudinary.uploader;
const upload = multer({ dest: "./uploads/" });

// Middleware to handle file uploads
exports.sendMessage = upload.array('attachments', 5);

exports.sendMessageController = async (req, res) => {
   
    const { senderId, receiverId, text } = req.body;

    try {
        let attachments = [];

        // Handle file uploads
        if (req.files && req.files.length > 0) {
            attachments = await Promise.all(req.files.map(async (file) => {
                try {
                    const result = await uploader.upload(file.path, { resource_type: "auto" });
                    return {
                        uri: result.secure_url,
                        type: file.mimetype,
                        name: file.originalname
                    };
                } catch (uploadError) {
                    console.error('Error uploading file:', uploadError);
                    throw new Error('File upload failed');
                }
            }));
        }

        // Create a new message instance
        const newMessage = new Message({
            senderId,
            receiverId,
            text: text || "", // Use an empty string if text is not provided
            attachments,
            timestamp: new Date()
        });

        // Save the message to the database
        await newMessage.save();
        //unreadcount
      
        // Update communicatedUsers for both sender and receiver
        await User.updateOne(
            { _id: senderId },
            { $addToSet: { communicatedUsers: receiverId } }
        );
        await User.updateOne(
            { _id: receiverId },
            { $addToSet: { communicatedUsers: senderId } }
        );

        // Emit the message to all connected clients
        const io = getIO();
        io.emit('receiveMessage', {
            senderId,
            receiverId,
            text: newMessage.text,
            attachments: newMessage.attachments,
            timestamp: newMessage.timestamp
        });

        // Respond with the success message
        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            newMessage
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message',
            error: error.message
        });
    }
};

// Controller to get all messages between two users (excluding deleted ones for the current user)
exports.getMessages = async (req, res) => {
    const { senderId, receiverId } = req.params;
    const { userId } = req.query; // Current user's ID

    try {
        const messages = await Message.find({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId }
            ],
            deletedFor: { $ne: userId }  // Exclude messages deleted for the current user
        }).sort({ timestamp: 1 });

        res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve messages' });
    }
};

// Controller to get the list of users a particular user has communicated with
exports.getCommunicatedUsers = async (req, res) => {
    const { userId } = req.params;

    try {
        // Find all messages where the user is either the sender or receiver
        const messages = await Message.find({
            $or: [{ senderId: userId }, { receiverId: userId }],
        });

        // Extract unique user IDs from messages, excluding deleted ones
        const userIds = new Set();
        messages.forEach(message => {
            if (message.senderId !== userId && !message.deletedFor.includes(message.senderId)) {
                userIds.add(message.senderId);
            }
            if (message.receiverId !== userId && !message.deletedFor.includes(message.receiverId)) {
                userIds.add(message.receiverId);
            }
        });

        // Convert Set to Array and fetch user details
        const users = await User.find({ _id: { $in: Array.from(userIds) } });

        // Respond with the list of users
        res.status(200).json({ success: true, users });
    } catch (error) {
        console.error('Error fetching communicated users:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve communicated users' });
    }
};

  

// Controller to mark messages as read
exports.markMessagesAsRead = async (req, res) => {
    const { userId, senderId } = req.body; // Get userId and senderId from request body

    try {
        // Update messages to mark them as read by the current user (userId)
        await Message.updateMany(
            {
                receiverId: userId,
                senderId: senderId,
                // Check if the current user (userId) has not already read the message
                readBy: { $ne: userId },
            },
            {
                // Add the userId to the readBy array to mark it as read by this user
                $addToSet: { readBy: userId}
            }
        );

        res.status(200).json({ success: true, message: 'Messages marked as read by user' });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ success: false, message: 'Failed to mark messages as read' });
    }
};


exports.getUnreadMessagesCount = async (req, res) => {
    console.log('Request parameters:', req.params); // Log the request parameters
    const { senderId, receiverId } = req.params; // Get senderId and receiverId from request parameters

    try {
        // Check if senderId and receiverId are valid
        if (!senderId || senderId === 'null' || !receiverId || receiverId === 'null') {
            return res.status(400).json({ success: false, message: 'Both Sender ID and Receiver ID are required' });
        }

        // Log the senderId and receiverId to ensure they're being received correctly
        console.log('Sender ID in unread count:', senderId);
        console.log('Receiver ID in unread count:', receiverId);

        const unreadCount = await Message.countDocuments({
            senderId: senderId,        // Count messages sent by the sender
            receiverId: receiverId,    // Count messages sent to the receiver
            readBy: { $ne: receiverId } // Count only those messages not read by the receiver
        });

        res.status(200).json({ success: true, unreadCount });
    } catch (error) {
        console.error('Error fetching unread messages count:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve unread messages count' });
    }
};

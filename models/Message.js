const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to User (tenant or landlord)
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to User (tenant or landlord)
    required: true,
  },
  text: {
    type: String,
    required: false, // Make this optional to support messages with only attachments
  },
  attachments: [{
    uri: { type: String, required: true }, // Store the path to the multimedia file
    type: { type: String, required: true }, // MIME type
    name: { type: String, required: true }, // Original name of the file
  }],
  timestamp: {
    type: Date,
    default: Date.now,
  },
  deletedFor: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  readBy: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
],
});

// Create the Message model using the schema
const Message = mongoose.model("Message", messageSchema);

module.exports = Message;

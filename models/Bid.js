// models/Bid.js
const mongoose = require('mongoose');

const BidSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: [0, 'Bid amount must be positive'],
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaintenanceRequest',
    required: true,
  },
  serviceProviderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Bid', BidSchema);

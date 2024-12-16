const mongoose = require('mongoose');

// Define the schema for maintenance requests
const maintenanceRequestSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  propertyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Property' 
  },
  requestTitle: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Low',
  },
  category: {
    type: String,
    enum: [
      'Plumbing',
      'Electrical',
      'Cleaning',
      'Carpentry',
      'Painting',
      'Landscaping',
      'Pest Control',
      'Security Services',
      'Home Appliance Repair',
    ],
    default: 'Plumbing',
  },
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'Approved', 'Completed'],
    default: 'Pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, 
  },
  bidAmount: { 
    type: Number,
    default: 0, 
  },
  paymentIntentId: {
    type: String,
    required: false,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  isRated: {
    type: Boolean,
    default: false,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Export the model
module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);

// models/RentalApplication.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const rentalApplicationSchema = new Schema({
  tenantId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Tenant', 
    required: true 
  },
  landlordId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Landlord', 
    required: true 
  },
  propertyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true 
  },
  fullName: {
    type: String,
    required: true
  },
  dob: {
    type: Date,
    required: true
  },
  cnic: {
    type: String,
    required: true
  },
  jobTitle: {
    type: String,
    required: true
  },
  numberOfOccupants: {
    type: Number,
    required: true
  },
  hasPets: {
    type: Boolean,
    required: true
  },
  petDetails: {
    type: String
  },
  hasVehicles: {
    type: Boolean,
    required: true
  },
  vehicleDetails: {
    type: String
  },
  desiredMoveInDate: {
    type: Date,
    required: true
  },
  leaseType: {
    type: String,
    enum: ['Short Term', 'Long Term'],
    required: true
  },
  tenantInterest: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String, // Add this field to store the rejection reason
  },
  submissionDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('RentalApplication', rentalApplicationSchema);

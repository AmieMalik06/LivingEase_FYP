const mongoose = require('mongoose');
const leaseAgreementSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the tenant collection
    required: true
  },
  landlordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the landlord collection
    required: true
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property', // Reference to the property collection
    required: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentalApplication', // Reference to the rental application
    required: true
  },
  rent: {
    type: Number,
    required: true,
  },
  tenancyStartDate: {
    type: Date,
    required: true,
  },
  tenancyEndDate: {
    type: Date,
    required: true,
  },
  landlordName: {
    type: String,
    required: true,
  },
  tenantName: {
    type: String,
    required: true,
  },
  landlordCnic: {
    type: String,
    required: true,
  },
  tenantCnic: {
    type: String,
    required: true,
  },
  landlordSignature: {
    type: String,
    
  },
  tenantSignature: {
    type: String,
  
  },
  status: {
    type: String,
    enum: ['Pending', 'Active', 'Terminated','Rejected'],
    default: 'Pending',
  },
  terms: {
    type: [String], 
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  terminationDate: {  // Add terminationDate field
    type: Date,
    default: null, // Null means the lease is not terminated yet
  },
  landlordRated: {
    type: Boolean,
    default: false, // To track if the landlord has rated the tenant
  },
  tenantRated: {
    type: Boolean,
    default: false, // To track if the tenant has rated the landlord
  },
});

// Pre-save middleware to update the `updatedAt` field before each save
leaseAgreementSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Export the model
module.exports = mongoose.model('LeaseAgreement', leaseAgreementSchema);

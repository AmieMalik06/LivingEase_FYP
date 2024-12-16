const mongoose = require('mongoose');

const ServiceProviderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  services: {
    type: [String], // Array of strings to store categories
    required: true,
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
    ], // Valid service categories
    default: [],
  },
 
 
});

module.exports = mongoose.model('ServiceProvider', ServiceProviderSchema);

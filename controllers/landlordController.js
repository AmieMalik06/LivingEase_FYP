// controllers/landlordController.js
const Property = require('../models/Property'); // Adjust the path according to your project structure
const User = require('../models/User'); // Adjust the path according to your project structure

// Get landlord details by property ID
exports.getLandlordByPropertyId = async (req, res) => {
  try {
    // Find the property by ID
    const property = await Property.findById(req.params.propertyId).populate('owner');

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Ensure the property has an owner
    if (!property.owner) {
      return res.status(404).json({ message: 'Landlord not found for this property' });
    }

    // Return the landlord details
    res.json(property.owner);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

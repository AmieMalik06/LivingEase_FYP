const Bid = require('../models/Bid');
const MaintenanceRequest = require('../models/MaintenanceRequest'); // Assuming you have this model
const ServiceProvider = require('../models/ServiceProvider');
const User = require('../models/User');

// Controller for placing a bid
exports.placeBid = async (req, res) => {
  const { bidAmount, maintenanceRequestId, userId } = req.body; // Access maintenanceRequestId from the request body
  console.log(req.body); // Log the request body for debugging
  const serviceProviderId = userId; // Assuming the userId is provided in the body

  try {
    // Check if the maintenance request exists
    const request = await MaintenanceRequest.findById(maintenanceRequestId); // Use maintenanceRequestId from the body
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Create the bid document
    const newBid = new Bid({
      amount: bidAmount,
      requestId: maintenanceRequestId, // Ensure this is the correct field
      serviceProviderId,
    });

    // Save the bid to the database
    await newBid.save();

    // Respond with the created bid
    res.status(201).json({
      message: 'Bid placed successfully',
      bid: newBid,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
 // Controller for getting bids for a specific maintenance request

// Controller for getting bids for a specific maintenance request
exports.getBidsForRequest = async (req, res) => {
  const { maintenanceRequestId } = req.params; // Access maintenanceRequestId from URL parameters

  try {
    // Step 1: Check if the maintenance request exists
    const request = await MaintenanceRequest.findById(maintenanceRequestId);
    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Step 2: Get all bids associated with this maintenance request
    const bids = await Bid.find({ requestId: maintenanceRequestId });

    // Step 3: For each bid, fetch the ServiceProvider and User details
    const detailedBids = await Promise.all(
      bids.map(async (bid) => {
        // Use the userId from the MaintenanceRequest to find the ServiceProvider
        const serviceProvider = await ServiceProvider.findOne({ user: bid.serviceProviderId }).populate('user', 'firstName lastName email');
        
        return {
          ...bid._doc,
          serviceProviderDetails: serviceProvider
            ? {
                services: serviceProvider.services,
                location: serviceProvider.location,
                userDetails: serviceProvider.user, // Includes firstName, lastName, and email
              }
            : null,
        };
      })
    );

    // Step 4: Respond with the detailed bids
    res.status(200).json({
      message: 'Bids fetched successfully',
      bids: detailedBids,
    });
  } catch (error) {
    console.error('Error fetching bids:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
const ServiceProvider = require('../models/ServiceProvider'); // Assuming the model path is correct
const mongoose = require('mongoose');
const User = require('../models/User');  
const Property=require('../models/Property')
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Bid= require('../models/Bid')
// Controller to update the services of a service provider
exports.updateServices = async (req, res) => {

  const { userId, services, firstName, lastName, contactNumber } = req.body; // Expecting the user ID, services, and profile details

  // Validate services input
  if (!services || services.length === 0) {
    return res.status(400).json({ error: 'At least one service must be selected' });
  }

  const validServices = [
    'Plumbing',
    'Electrical',
    'Cleaning',
    'Carpentry',
    'Painting',
    'Landscaping',
    'Pest Control',
    'Security Services',
    'Home Appliance Repair',
  ];

  // Validate if all selected services are valid
  const isValid = services.every(service => validServices.includes(service));

  if (!isValid) {
    return res.status(400).json({ error: 'Invalid service category selected' });
  }

  try {
    // First, update the user's profile (firstName, lastName, contactNumber)
    const user = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, contactNumber },
      { new: true } // Return the updated user document
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Then, update the service provider's services
    const serviceProvider = await ServiceProvider.findOneAndUpdate(
      { user: userId },
      { services },
      { new: true } // Return the updated document
    );

    if (!serviceProvider) {
      return res.status(404).json({ error: 'Service provider not found' });
    }

    return res.status(200).json({
      message: 'Profile and services updated successfully',
      data: { user, serviceProvider },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};
// Controller to fetch the services of a service provider
exports.getServices = async (req, res) => {
  const { userId } = req.params; // Expecting the user ID as a route parameter

  try {
    // Fetch the service provider by userId
    const serviceProvider = await ServiceProvider.findOne({ user: userId });

    if (!serviceProvider) {
      return res.status(404).json({ error: 'Service provider not found' });
    }

    // Fetch the user profile data as well if needed
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return the service provider's services and user details
    return res.status(200).json({
      message: 'Service provider services fetched successfully',
      data: {
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          contactNumber: user.contactNumber,
        },
        services: serviceProvider.services,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Controller for submitting a maintenance request
exports.submitMaintenanceRequest = async (req, res) => {
  try {
    const { tenantId, requestTitle, description, priority, category } = req.body;

    // Check if the tenantId is valid and exists in the database
    const tenant = await User.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        message: 'Tenant not found. Please provide a valid tenant ID.',
      });
    }

    // Find the property associated with the tenant
    const rentedProperty = await Property.findOne({ rentedBy: tenantId });
    if (!rentedProperty) {
      return res.status(400).json({
        message: 'No property found associated with this tenant.',
      });
    }

    // Get the propertyId from the found property
    const propertyId = rentedProperty._id;

    // Create a new maintenance request document
    const newRequest = new MaintenanceRequest({
      tenantId,
      propertyId, // Associate the propertyId with the maintenance request
      requestTitle,
      description,
      priority,
      category,
    });

    // Save the maintenance request to the database
    await newRequest.save();

    // Respond with a success message and the created request
    res.status(201).json({
      message: 'Maintenance request submitted successfully.',
      request: newRequest,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error submitting maintenance request.',
      error: error.message,
    });
  }
};


exports.getTenantMaintenanceRequests = async (req, res) => {
  const { tenantId } = req.params; // Get the tenant ID from the route parameters

  try {
    // Check if the tenant exists
    const tenant = await User.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        message: 'Tenant not found. Please provide a valid tenant ID.',
      });
    }

    // Fetch all maintenance requests for the tenant
    const maintenanceRequests = await MaintenanceRequest.find({ tenantId });

    if (maintenanceRequests.length === 0) {
      return res.status(200).json({
        message: 'No maintenance requests found for this tenant.',
        data: [],
      });
    }

    // Respond with the fetched maintenance requests
    res.status(200).json({
      message: 'Maintenance requests fetched successfully.',
      data: maintenanceRequests,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching maintenance requests.',
      error: error.message,
    });
  }
};

//controller to fetch maintenance requests for landlord
exports.getLandlordMaintenanceRequests = async (req, res) => {
  const { landlordId } = req.params; // Get the landlord ID from the route parameters

  try {
    // Find all properties owned by the landlord
    const properties = await Property.find({ owner: landlordId }, '_id propertyName location'); // Fetch only the required fields

    if (!properties || properties.length === 0) {
      // Return a success response with an empty array
      return res.status(200).json({
        message: 'No properties found for this landlord.',
        data: [], // Empty data array
      });
    }

    // Create a map of property details for quick access
    const propertyDetailsMap = properties.reduce((map, property) => {
      map[property._id] = {
        propertyName: property.propertyName,
        location: property.location,
      };
      return map;
    }, {});

    // Extract property IDs from the landlord's properties
    const propertyIds = properties.map(property => property._id);

    // Fetch all maintenance requests related to these properties
    const maintenanceRequests = await MaintenanceRequest.find({
      propertyId: { $in: propertyIds },
    })
      .populate('tenantId', 'firstName lastName') // Populate tenant details
      .sort({ createdAt: -1 }); // Sort by created date, latest first

    if (maintenanceRequests.length === 0) {
      // Return a success response with an empty array
      return res.status(200).json({
        message: 'No maintenance requests found for this landlord.',
        data: [], // Empty data array
      });
    }

    // Enhance maintenance requests with property details
    const enhancedRequests = maintenanceRequests.map(request => {
      const propertyDetails = propertyDetailsMap[request.propertyId];
      return {
        ...request._doc, // Spread the original request object
        propertyName: propertyDetails?.propertyName || 'Unknown',
        location: propertyDetails?.location || 'Unknown',
      };
    });

    // Respond with the enhanced maintenance requests
    res.status(200).json({
      message: 'Maintenance requests fetched successfully.',
      data: enhancedRequests,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching maintenance requests.',
      error: error.message,
    });
  }
};


// Controller function to update the status of a maintenance request
exports.updateMaintenanceRequestStatus = async (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body;

  try {
  

    // Find the maintenance request and update its status
    const updatedRequest = await MaintenanceRequest.findByIdAndUpdate(
      requestId,
      { status },
      { new: true } // Return the updated document
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    res.status(200).json({
      message: 'Maintenance request status updated successfully',
      request: updatedRequest,
    });
  } catch (error) {
    console.error('Error updating maintenance request status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Controller function to get all maintenance requests
exports.getAllMaintenanceRequests = async (req, res) => {
  try {
    const maintenanceRequests = await MaintenanceRequest.find()
      .populate('tenantId', 'firstName lastName')  // Optionally populate tenantId with name and email fields
      .populate('propertyId', 'propertyName location')  // Optionally populate propertyId with property details
      .exec();

    if (!maintenanceRequests || maintenanceRequests.length === 0) {
      return res.status(404).json({ message: 'No maintenance requests found' });
    }

    res.status(200).json(maintenanceRequests); // Return all maintenance requests
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Controller to assign a service provider to a maintenance request, including bid amount
exports.assignServiceProvider = async (req, res) => {
  const { maintenanceRequestId, serviceProviderId, bidAmount } = req.body; 
  console.log(req.body)
  // Get bidAmount from the request body

  try {
    // Find the maintenance request by its ID
    const maintenanceRequest = await MaintenanceRequest.findById(maintenanceRequestId);
    if (!maintenanceRequest) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Find the bid associated with the maintenance request and service provider
   


    // Assign the service provider and bid amount to the maintenance request
    maintenanceRequest.assignedTo = serviceProviderId;
    maintenanceRequest.bidAmount = bidAmount; // Use the bid amount received from the frontend
    maintenanceRequest.status = 'Assigned'; // Set status to 'Approved' or 'Assigned'

    // Save the updated maintenance request
    await maintenanceRequest.save();

    res.status(200).json({
      message: 'Service provider assigned and bid approved successfully',
      maintenanceRequest,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
// Controller to get service provider assigned to a request
exports.getServiceProviderDetails = async (req, res) => {
  const { maintenanceRequestId } = req.params; // Get the maintenance request ID from the route parameters

  try {
    // Fetch the maintenance request by its ID and populate the assigned service provider details
    const maintenanceRequest = await MaintenanceRequest.findById(maintenanceRequestId)
      .populate({
        path: 'assignedTo',
        select: 'firstName lastName contactNumber stripeAccountId', // Populate service provider details (you can modify the fields you need)
      })
      .exec();

    // Check if the maintenance request exists
    if (!maintenanceRequest) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Check if the maintenance request has an assigned service provider
    if (!maintenanceRequest.assignedTo) {
      return res.status(404).json({ message: 'No service provider assigned to this maintenance request' });
    }

    // Return the service provider details along with the maintenance request info
    res.status(200).json({
      message: 'Service provider details fetched successfully',
      data: {
        maintenanceRequest: {
          requestTitle: maintenanceRequest.requestTitle,
          description: maintenanceRequest.description,
          priority: maintenanceRequest.priority,
          status: maintenanceRequest.status,
          bidAmount: maintenanceRequest.bidAmount,
          isRated: maintenanceRequest.isRated,
        },
        serviceProvider: maintenanceRequest.assignedTo, // Service provider details
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching service provider details', error: error.message });
  }
};
const stripe = require("stripe")(
  "sk_test_51QEDFEKHTVoAtM1EAie7ysWsMvGHKLWdzK42nCB2wKAHzMS5bsnsCed3NzA5xOmBxIvry084FISHhiJHXnkOLOYN00NaeOoOm7"
);
const ServiceProvider = require('../models/ServiceProvider');
const User =require ('../models/User');
const MaintenanceRequest= require('../models/MaintenanceRequest');
const asyncHandler = require('express-async-handler');

exports.getAllServiceProviders = asyncHandler(async (req, res) => {
  try {
    // Fetch all service providers from the database
    const serviceProviders = await ServiceProvider.find()
      .populate('user', 'firstName lastName email') // Populate user details (optional)
      .select('user services location ratings'); // Select the fields you need

    // Check if there are any service providers
    if (!serviceProviders || serviceProviders.length === 0) {
      return res.status(404).json({ message: 'No service providers found.' });
    }

    // Return the list of service providers
    res.status(200).json(serviceProviders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});
// Controller to get all requests assigned to a service provider
exports.getAssignedRequests = async (req, res) => {
  const { serviceProviderId } = req.params;  // The service provider's ID from the request parameters

  try {
    // Check if the service provider exists (optional but recommended)
    const serviceProvider = await User.findById(serviceProviderId);
    if (!serviceProvider) {
      return res.status(404).json({ message: 'Service provider not found.' });
    }

    // Find all maintenance requests assigned to this service provider
    const assignedRequests = await MaintenanceRequest.find({ assignedTo: serviceProviderId })
      .populate('tenantId', 'firstName lastName')  // Populate tenant details
      .populate('propertyId', 'name location')  // Populate property details
      .exec();

    // If no requests found, send a message
    if (assignedRequests.length === 0) {
      return res.status(404).json({ message: 'No assigned requests found.' });
    }

    // Return the assigned requests
    res.status(200).json({
      message: 'Assigned requests retrieved successfully.',
      data: assignedRequests,
    });

  } catch (error) {
    console.error('Error retrieving assigned requests:', error);
    res.status(500).json({ message: 'Failed to retrieve assigned requests.' });
  }
};


exports.processServicePayment = asyncHandler(async (req, res) => {
  const { maintenanceRequestId, amount, landlordId, serviceProviderStripeId } = req.body;
  console.log(req.body)

  // Validate input fields
  if (!maintenanceRequestId || !amount || !landlordId || !serviceProviderStripeId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Create a PaymentIntent for the service provider payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency: 'usd', // Change to your currency
      metadata: { maintenanceRequestId, landlordId, serviceProviderStripeId },
      transfer_data: {
        destination: serviceProviderStripeId, // Direct payment to the service provider's Stripe account
      },
    });

    // Respond with the PaymentIntent's client secret
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({
      message: "An error occurred while processing your payment. Please try again later.",
    });
  }
});

exports.confirmServicePayment = asyncHandler(async (req, res) => {
  const { paymentIntentId, paymentStatus, requestId } = req.body;

  console.log('Confirm Payment Request Body:', req.body); // Debugging log

  // Validate input fields
  if (!paymentIntentId || !paymentStatus || !requestId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Find the maintenance request by its _id field
    const maintenanceRequest = await MaintenanceRequest.findOne({ _id: requestId });

    console.log('Maintenance Request Found:', maintenanceRequest); // Debugging log

    if (!maintenanceRequest) {
      return res.status(404).json({ message: "Maintenance request not found" });
    }

    // Update the payment status
    if (paymentStatus === 'completed') {
      maintenanceRequest.paymentStatus = 'completed';
    } else {
      maintenanceRequest.paymentStatus = 'failed'; // Mark as failed if payment status is not "completed"
    }

    // Save the updated maintenance request
    await maintenanceRequest.save();

    // Respond with the updated maintenance request and payment status
    res.status(200).json({
      message: `Payment status updated to ${paymentStatus}`,
      maintenanceRequest,
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    res.status(500).json({ message: "Error confirming payment" });
  }
});


// Controller to get the profile details of a service provider
exports.getServiceProviderProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  console.log('Received userId:', userId);  // Log the userId to verify it's being passed correctly

  try {
    const serviceProvider = await ServiceProvider.findOne({ user: userId })
      .populate('user', 'firstName lastName email contactNumber profileImage')  // Populate the user and include profileImage
      .select('services location ratings');  // Select the other fields from ServiceProvider model

    if (!serviceProvider) {
      return res.status(404).json({ message: 'Service provider not found.' });
    }

    // Log the populated service provider object to check the profile image
    console.log('Service Provider:', serviceProvider);

    res.status(200).json(serviceProvider);  // Return the service provider profile
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});



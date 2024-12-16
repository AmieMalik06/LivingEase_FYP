const express = require('express');
const { getAllServiceProviders,getAssignedRequests,getServiceProviderProfile,processServicePayment,confirmServicePayment } = require('../controllers/serviceproviderController');
const router = express.Router();

// Route to get all service providers
router.get('/allserviceproviders', getAllServiceProviders);
// Route to update the status of a maintenance request

// Route to get all assigned requests for a service provider
router.get('/assigned-requests/:serviceProviderId', getAssignedRequests);

// Route to process payment for service provider
router.post('/process-service-payment', processServicePayment);

// Route to confirm payment for service provider
router.post('/confirm-service-payment', confirmServicePayment);

// Route to get profile of service provider
router.get('/profile/:userId', getServiceProviderProfile);
module.exports = router;

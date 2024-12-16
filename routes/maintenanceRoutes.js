const express = require('express');
const router = express.Router();
const { updateServices,assignServiceProvider,getServices,getServiceProviderDetails,updateMaintenanceRequestStatus,getAllMaintenanceRequests,submitMaintenanceRequest ,getLandlordMaintenanceRequests,getTenantMaintenanceRequests} = require('../controllers/maintenanceController'); // Assuming controller path is correct

// Route to update services
router.put('/service-provider/update-services', updateServices);
// Route to get services of a service provider by userId
router.get('/service-provider/:userId/services', getServices);
// Route for submitting a maintenance request
router.post('/submit-maintenance-request', submitMaintenanceRequest);
// Route to fetch all maintenance requests of a tenant
router.get('/tenant/:tenantId/requests', getTenantMaintenanceRequests);
// Route to fetch all maintenance requests of a landlord
router.get('/landlord/:landlordId/requests', getLandlordMaintenanceRequests);
//route to update status of maintenance request
router.put('/:requestId/status', updateMaintenanceRequestStatus);
// Route to get all maintenance requests
router.get('/requests', getAllMaintenanceRequests);
// Route to assign maintenance requests
router.post('/assign', assignServiceProvider);
// Route to get service provider details for a maintenance request
router.get('/service-provider/:maintenanceRequestId', getServiceProviderDetails);
module.exports = router;

// routes/rentalApplicationRoutes.js
const express = require('express');
const router = express.Router();
const rentalApplicationController = require('../controllers/rentalApplicationController');

// Submit a rental application
router.post('/rental-applications', rentalApplicationController.submitRentalApplication);
// Get all rental applications for a tenant
router.get('/tenant/:tenantId/rental-applications', rentalApplicationController.getRentalApplicationsByTenant);
// Get all rental applications for a landlord
router.get('/landlords/:landlordId/rental-applications', rentalApplicationController.getRentalApplicationsByLandlord);
// Update rental application status
router.patch('/rental-applications/:applicationId/status', rentalApplicationController.updateApplicationStatus);
// Get rental application details by ID
router.get('/rental-applications/:applicationId', rentalApplicationController.getRentalApplicationById);
module.exports = router;

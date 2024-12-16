const express = require('express');
const router = express.Router();
const leaseAgreementController = require('../controllers/leaseAgreementController');

// Create a new lease agreement
router.post('/', leaseAgreementController.createLeaseAgreement);

// Get all lease agreements
router.get('/', leaseAgreementController.getAllLeaseAgreements);

// Get a specific lease agreement by ID
router.get('/:id', leaseAgreementController.getLeaseAgreementById);

// Update a lease agreement by ID
router.put('/:id', leaseAgreementController.updateLeaseAgreement);

// Delete a lease agreement by ID
router.delete('/:id', leaseAgreementController.deleteLeaseAgreement);
// Get lease agreements by tenant ID
router.get('/tenant/:tenantId', leaseAgreementController.getLeaseAgreementsByTenantId);

// Get lease agreements by landlord ID
router.get('/landlord/:landlordId', leaseAgreementController.getLeaseAgreementsByLandlordId);
// Route to delete a lease agreement by ID
router.delete('/:id', leaseAgreementController.deleteLeaseAgreement);
// Route to check if a tenant has an active lease
router.get('/active/:tenantId', leaseAgreementController.checkActiveLease);
// Route to mark tenant or landlord rating as true
router.put('/rate-user/:leaseId', leaseAgreementController.rateUser);  // Add this route
//check pending ratings
router.get('/check-pending-rating/:tenantId', leaseAgreementController.checkPendingRatingTenant);
//check pending ratings of landlord
router.get('/check-pending-rating-landlord/:landlordId', leaseAgreementController.checkPendingRatingLandlord);
module.exports = router;

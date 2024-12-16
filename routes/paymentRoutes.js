const express = require('express');
const router = express.Router();
const {
  createStripeAccount,checkStripeAccountStatus,processRentPayment,getPaidPaymentsForLandlord,getPendingPaymentsForLandlord,getPendingPayments,confirmPayment,getPaidPaymentsforTenant
} = require('../controllers/paymentController');
// Route to create a Stripe Connect account
router.post('/create-stripe-account', createStripeAccount);
// Route to check Stripe account status
router.get('/:userId/stripe-status', checkStripeAccountStatus);
// POST route to create a payment intent
router.post('/process-rent-payment', processRentPayment);
// Route to get pending payments for a tenant
router.get('/pending-payments/:tenantId', getPendingPayments);
// Route to fetch paid payments for a tenant
router.get('/paid-payments/:tenantId', getPaidPaymentsforTenant);
// Route to fetch paid payments for a tenant
router.get('/pending-landlord-payments/:landlordId', getPendingPaymentsForLandlord);
// Route to fetch paid payments for a landlord
router.get('/paid-landlord-payments/:landlordId', getPaidPaymentsForLandlord);
// Route to confirm payment status
router.post('/confirm-payment', confirmPayment);
module.exports = router;

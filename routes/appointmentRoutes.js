// routes/appointmentRoutes.js
const express = require('express');
const { createAppointment, getAppointmentsByTenant,getAppointmentsByLandlord ,updateAppointmentStatus} = require('../controllers/appointmentController');

const router = express.Router();

// Create a new appointment
router.post('/appointments', createAppointment);
// Get appointments for a specific tenant
router.get('/appointments/:tenantId', getAppointmentsByTenant);
//Get appointments for a specific landlord
router.get('/appointments/landlord/:landlordId', getAppointmentsByLandlord); 
// For updating property status
router.patch('/:id/status', updateAppointmentStatus); 

module.exports = router;

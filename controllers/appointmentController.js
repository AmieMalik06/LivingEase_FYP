// controllers/appointmentController.js
const Appointment = require('../models/Appointment');

exports.createAppointment = async (req, res) => {
  const { tenantId, propertyId,ownerId, appointmentDate, appointmentTime } = req.body;

  try {
    const newAppointment = new Appointment({
      tenantId,
      propertyId,
    ownerId,
      appointmentDate,
      appointmentTime,
    });

    await newAppointment.save();
    res.status(201).json({ message: 'Appointment scheduled successfully', newAppointment });
  } catch (error) {
    res.status(500).json({ message: 'Error scheduling appointment', error: error.message });
  }
};

exports.getAppointmentsByTenant = async (req, res) => {
  const { tenantId } = req.params;

  try {
    const appointments = await Appointment.find({ tenantId }) // Populate propertyId for property details
    .populate('propertyId') 
    .populate({
      path: 'ownerId', 
      model: 'User', 
    });
    res.status(200).json(appointments);
    
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
};
exports.getAppointmentsByLandlord = async (req, res) => {
  const { landlordId } = req.params;

  try {
    const appointments = await Appointment.find({ ownerId: landlordId })
      .populate('propertyId') // Populate propertyId for property details
      .populate({
        path: 'tenantId', // Populate tenantId
        model: 'User', // Specify the User model
      });

    res.status(200).json(appointments);
    
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  const { id } = req.params; // Appointment ID from the URL
  const { status } = req.body; // New status from the request body

  try {
    // Validate the status value
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: true } // Return the updated document
    );

    if (!updatedAppointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.status(200).json({ message: 'Appointment status updated successfully', updatedAppointment });
  } catch (error) {
    res.status(500).json({ message: 'Error updating appointment status', error: error.message });
  }
};

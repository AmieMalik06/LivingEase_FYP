const LeaseAgreement = require('../models/LeaseAgreement');
const Notification= require('../models/Notification');
const Property = require('../models/Property');
// Create a new lease agreement
exports.createLeaseAgreement = async (req, res) => {
  try {
    const leaseAgreement = new LeaseAgreement(req.body);
    await leaseAgreement.save();
    res.status(201).json(leaseAgreement);
  } catch (error) {
    res.status(400).json({ message: 'Error creating lease agreement', error });
  }
};

// Get all lease agreements
exports.getAllLeaseAgreements = async (req, res) => {
  try {
    const leaseAgreements = await LeaseAgreement.find().populate('tenantId landlordId propertyId applicationId');
    res.status(200).json(leaseAgreements);
  } catch (error) {
    res.status(400).json({ message: 'Error fetching lease agreements', error });
  }
};

// Get a specific lease agreement by ID
exports.getLeaseAgreementById = async (req, res) => {
  try {
    const leaseAgreement = await LeaseAgreement.findById(req.params.id).populate('tenantId landlordId propertyId applicationId');
    if (!leaseAgreement) {
      return res.status(404).json({ message: 'Lease agreement not found' });
    }
    res.status(200).json(leaseAgreement);
  } catch (error) {
    res.status(400).json({ message: 'Error fetching lease agreement', error });
  }
};
// Update a lease agreement (handles termination and tenancy end date logic)
exports.updateLeaseAgreement = async (req, res) => {
  const { status, terminationReason, tenancyEndDate } = req.body;

  try {
    const leaseToUpdate = await LeaseAgreement.findById(req.params.id);
    if (!leaseToUpdate) {
      return res.status(404).json({ message: 'Lease agreement not found' });
    }

    // Handle lease termination logic
    if (status === 'Terminated') {
      leaseToUpdate.status = 'Terminated';
      leaseToUpdate.terminationDate = new Date(); // Set the current date as the termination date

      if (terminationReason) {
        leaseToUpdate.terminationReason = terminationReason; // Set termination reason if provided
      }
    }

    // Automatically terminate the lease if the tenancyEndDate has passed and status is still 'Active'
    if (new Date(tenancyEndDate) <= new Date() && leaseToUpdate.status !== 'Terminated') {
      leaseToUpdate.status = 'Terminated';
      leaseToUpdate.terminationDate = leaseToUpdate.terminationDate || new Date(); // Set terminationDate if it's not already set
    }

    // If the status is updated to 'Active', create a notification for the landlord
    if (status === 'Active') {
      const landlordId = leaseToUpdate.landlordId; // Assuming leaseToUpdate has a landlordId field

      // Get the property details from the propertyId in the lease agreement
      const property = await Property.findById(leaseToUpdate.propertyId);
      if (!property) {
        console.error('Property not found');
        return res.status(404).json({ message: 'Property not found' });
      }

      // Create a message with the property name
      const message = `Lease agreement for property ${property.propertyName} has been signed by tenant.`;

      // Create a new notification for the landlord
      const newNotification = new Notification({
        userId: landlordId, // Use the landlordId
        title: 'Lease Agreement Activated',
        description: message,
        timestamp: new Date(),
      });

      // Save the notification
      await newNotification.save();
    }

    // Update other fields if provided in the request body
    Object.assign(leaseToUpdate, req.body);

    // Save the updated lease agreement
    await leaseToUpdate.save();

    res.status(200).json(leaseToUpdate);
  } catch (error) {
    console.error('Error updating lease agreement:', error); // Log the error for better debugging
    res.status(500).json({ message: 'Error updating lease agreement', error: error.message });
  }
};

exports.checkActiveLease = async (req, res) => {
  const { tenantId } = req.params;

  try {
    // Check for an active lease for the given tenantId
    const activeLease = await LeaseAgreement.findOne({ tenantId, status: 'Active' })
      .populate('landlordId'); // Populate the landlordId field with the full landlord details

    if (activeLease) {
      return res.status(200).json({ active: true, lease: activeLease });
    } else {
      return res.status(200).json({ active: false });
    }
  } catch (error) {
    console.error('Error checking active lease:', error.message);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};



// Delete a lease agreement
exports.deleteLeaseAgreement = async (req, res) => {
  try {
    const leaseAgreement = await LeaseAgreement.findByIdAndDelete(req.params.id);
    if (!leaseAgreement) {
      return res.status(404).json({ message: 'Lease agreement not found' });
    }
    res.status(200).json({ message: 'Lease agreement deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting lease agreement', error });
  }
};
// Get lease agreements by tenant ID
exports.getLeaseAgreementsByTenantId = async (req, res) => {
    try {
      const tenantId = req.params.tenantId;
      const leaseAgreements = await LeaseAgreement.find({ tenantId }).populate('tenantId landlordId propertyId applicationId');
      if (!leaseAgreements.length) {
        return res.status(404).json({ message: 'No lease agreements found for this tenant' });
      }
      res.status(200).json(leaseAgreements);
    } catch (error) {
      res.status(400).json({ message: 'Error fetching lease agreements for tenant', error });
    }
  };
  
  // Get lease agreements by landlord ID
  exports.getLeaseAgreementsByLandlordId = async (req, res) => {
    try {
      const landlordId = req.params.landlordId;
      const leaseAgreements = await LeaseAgreement.find({ landlordId }).populate('tenantId landlordId propertyId applicationId');
  
      if (leaseAgreements.length === 0) {
        return res.status(200).json({ message: 'No lease agreements found for this landlord', data: [] });
      }
  
      res.status(200).json(leaseAgreements);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching lease agreements for landlord', error: error.message });
    }
  };
  
  // Delete a lease agreement
exports.deleteLeaseAgreement = async (req, res) => {
  try {
    const leaseAgreement = await LeaseAgreement.findByIdAndDelete(req.params.id);
    if (!leaseAgreement) {
      return res.status(404).json({ message: 'Lease agreement not found' });
    }
    res.status(200).json({ message: 'Lease agreement deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting lease agreement', error });
  }
};

exports.rateUser= async (req, res) => {
 // Lease ID from the URL
  const { ratedBy ,leaseId} = req.body; 
  console.log(req.params)   // `tenant` or `landlord` from the body to identify the rater
  
  try {
    // Find the lease agreement by leaseId
    const lease = await LeaseAgreement.findById(leaseId);

    if (!lease) {
      return res.status(404).json({ message: 'Lease agreement not found' });
    }

    // Depending on who is rating, update the corresponding field
    if (ratedBy === 'tenant') {
      if (lease.tenantRated) {
        return res.status(400).json({ message: 'Tenant has already rated the landlord' });
      }
      lease.tenantRated = true;
    } else if (ratedBy === 'landlord') {
      if (lease.landlordRated) {
        return res.status(400).json({ message: 'Landlord has already rated the tenant' });
      }
      lease.landlordRated = true;
    } else {
      return res.status(400).json({ message: 'Invalid ratedBy value. Use "tenant" or "landlord".' });
    }

    // Save the updated lease agreement
    await lease.save();
    return res.status(200).json({ message: `${ratedBy.charAt(0).toUpperCase() + ratedBy.slice(1)} rating saved successfully`, lease });
  } catch (error) {
    console.error('Error in rateUser:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

exports.checkPendingRatingTenant = async (req, res) => {
  const { tenantId } = req.params; // Extract tenantId from the request parameters

  try {
    // Find lease agreements where the tenant is involved and hasn't rated the landlord
    const pendingRatings = await LeaseAgreement.find({
      tenantId,
      status: 'Terminated', // Optional: Only check active leases
      tenantRated: false, // Check if the tenant hasn't rated
    }).populate('landlordId propertyId'); // Populate related fields if needed

    if (pendingRatings.length > 0) {
      return res.status(200).json({
        hasPendingRating: true,
        pendingRatings,
      });
    }

    return res.status(200).json({
      hasPendingRating: false,
      message: 'No pending ratings for this tenant.',
    });
  } catch (error) {
    console.error('Error checking pending ratings:', error.message);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
exports.checkPendingRatingLandlord = async (req, res) => {
  const { landlordId } = req.params; // Extract landlordId from the request parameters

  try {
    // Find lease agreements where the landlord is involved and hasn't rated the tenant
    const pendingRatings = await LeaseAgreement.find({
      landlordId,
      status: 'Terminated', // Optional: Only check terminated leases
      landlordRated: false, // Ensure that the landlord has not rated the tenant yet
    }).populate('tenantId propertyId'); // Populate related tenant and property data if needed

    if (pendingRatings.length > 0) {
      // If there are pending ratings, return them with the status
      return res.status(200).json({
        hasPendingRating: true,
        pendingRatings,
      });
    }

    // If no pending ratings, return a message indicating this
    return res.status(200).json({
      hasPendingRating: false,
      message: 'No pending ratings for this landlord.',
    });
  } catch (error) {
    console.error('Error checking pending ratings:', error.message);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
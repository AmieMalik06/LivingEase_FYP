const CommissionFee = require('../models/Commission');

const addCommissionFee = async (req, res) => {
  const { fee } = req.body;

  // Validate input
  if (!fee || typeof fee !== 'number' || fee <= 0) {
    return res.status(400).json({ message: 'Invalid or missing fee value' });
  }

  try {
    // Check if a commission fee already exists
    let commissionFee = await CommissionFee.findOne();

    if (commissionFee) {
      // Update existing commission fee
      commissionFee.fee = fee;
      await commissionFee.save();
      return res.status(200).json({
        message: 'Commission fee updated successfully',
        data: commissionFee,
      });
    } else {
      // Create a new commission fee
      commissionFee = new CommissionFee({ fee });
      await commissionFee.save();
      return res.status(201).json({
        message: 'Commission fee added successfully',
        data: commissionFee,
      });
    }
  } catch (error) {
    console.error('Error adding or updating commission fee:', error);
    res.status(500).json({ message: 'Failed to add or update commission fee' });
  }
};

module.exports = { addCommissionFee };

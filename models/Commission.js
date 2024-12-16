const mongoose = require("mongoose");

const commissionFeeSchema = new mongoose.Schema(
  {
    
      fee: {
      type: Number, 
      required: true,
    },
    },
  { timestamps: true } // Automatically add createdAt and updatedAt fields
);

module.exports = mongoose.model("CommissionFee", commissionFeeSchema);

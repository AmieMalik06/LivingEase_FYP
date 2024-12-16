const mongoose = require("mongoose");

// RentPayment Schema
const rentPaymentSchema = mongoose.Schema(
  {
    lease: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaseAgreement", // Refers to the Lease model
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Refers to the User (tenant) model
      required: true,
    },
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Refers to the Landlord model
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentIntentId: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    month: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RentPayment", rentPaymentSchema);

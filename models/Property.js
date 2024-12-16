const mongoose = require("mongoose");
const propertySchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    propertyName: {
      type: String,
      required: true,
    },
    propertyDescription: {
      type: String,
    },
    rentPrice: {
      type: Number,
      required: true,
    },
    bedrooms: {
      type: Number,
      required: false,
    },
    bathrooms: {
      type: Number,
      required: false,
    },
    propertySize: {
      type: Number,
      required: true,
    },
    sizeUnit: {
      type: String,
      enum: ["Marla", "Sq Ft", "Sq M", "Sq Yd", "Kanal"],
      required: true,
    },
    features: [
      {
        type: String,
      },
    ],
    locationLatLng: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    images: [
      {
        uri: {
          type: String,
          required: true,
        },
      },
    ],
    status: {
      type: String,
      enum: ["listed", "rented"],
      default: "listed", // Default value is "listed"
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rentedBy: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      default: null, 
    },
  },

  {
    timestamps: true,
  }
);

const Property = mongoose.model("Property", propertySchema);

module.exports = Property;

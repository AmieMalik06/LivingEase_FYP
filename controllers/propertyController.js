const Property = require("../models/Property");
const cloudinary = require("../config/cloudinary");
const multer = require("multer");
const mongoose = require('mongoose'); // Import mongoose
const uploader = cloudinary.uploader;
const upload = multer({ dest: "./uploads/" });

exports.addProperty = upload.array("images");

exports.addPropertyController = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Handle file uploads
    const images =
      req.files && req.files.length
        ? await Promise.all(
            req.files.map((file) =>
              uploader.upload(file.path, { resource_type: "image" })
            )
          )
        : [];

    // Parse locationLatLng
    const { type, coordinates } = JSON.parse(req.body.locationLatLng || "{}");
    if (type !== "Point" || !coordinates || coordinates.length !== 2) {
      return res.status(400).json({ error: "Invalid locationLatLng format" });
    }

    const [lat, lng] = coordinates;

    // Parse and validate features
    let features = [];
    if (req.body.features) {
      try {
        features = JSON.parse(req.body.features);
        if (!Array.isArray(features)) {
          throw new Error("Features should be an array");
        }
      } catch (error) {
        console.error("Error parsing features:", error);
        features = [];
      }
    }

    // Log parsed features for debugging
    console.log("Parsed features:", features);

    // Build the property object conditionally
    const propertyData = {
      category: req.body.category,
      location: req.body.location,
      propertyName: req.body.propertyName,
      propertyDescription: req.body.propertyDescription,
      rentPrice: req.body.rentPrice,
      propertySize: req.body.propertySize,
      sizeUnit: req.body.sizeUnit,
      images: images.map((image) => ({ uri: image.secure_url })),
      owner: req.user.id,
      locationLatLng: {
        type,
        coordinates,
      },
    };
  
      propertyData.bedrooms = req.body.bedrooms;
      propertyData.bathrooms = req.body.bathrooms;

    if (features.length > 0) {
      propertyData.features = features;
    }

    const property = new Property(propertyData);

    // Save the property
    await property.save();
    return res.status(201).json({
      message: "Property added successfully",
      property,
    });
  } catch (error) {
    console.error("Error adding property:", error);
    return res
      .status(500)
      .json({ error: "Error adding property", message: error.message });
  }
};



exports.updateProperty = upload.array("images");

exports.updatePropertyController = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { propertyId } = req.params; // Get property ID from the request parameters

    // Find the existing property
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Check if the user is the owner of the property
    if (property.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: "Forbidden, not the owner of the property" });
    }

    // Handle file uploads if present
    let images = [];
    if (req.files && req.files.length) {
      images = await Promise.all(
        req.files.map((file) => uploader.upload(file.path, { resource_type: "image" }))
      ).catch((uploadError) => {
        console.error("Error uploading images:", uploadError);
        return res.status(500).json({ error: "Error uploading images", message: uploadError.message });
      });
    }

    // Parse and validate features
    let features = [];
    if (req.body.features) {
      try {
        features = JSON.parse(req.body.features);
        if (!Array.isArray(features)) {
          throw new Error("Features should be an array");
        }
      } catch (error) {
        console.error("Error parsing features:", error);
        return res.status(400).json({ error: "Invalid features format" });
      }
    }

    // Parse and validate locationLatLng
    let locationLatLng = {};
    if (req.body.locationLatLng) {
      try {
        locationLatLng = JSON.parse(req.body.locationLatLng);
        const { type, coordinates } = locationLatLng;
        if (type !== "Point" || !Array.isArray(coordinates) || coordinates.length !== 2) {
          throw new Error("Invalid locationLatLng format");
        }
      } catch (error) {
        console.error("Error parsing locationLatLng:", error);
        return res.status(400).json({ error: "Invalid locationLatLng format" });
      }
    }

    const { type, coordinates } = locationLatLng;

    // Update the property with the provided data
    const updatedProperty = await Property.findByIdAndUpdate(
      propertyId,
      {
        category: req.body.category || property.category,
        location: req.body.location || property.location,
        propertyName: req.body.propertyName || property.propertyName,
        propertyDescription: req.body.propertyDescription || property.propertyDescription,
        rentPrice: req.body.rentPrice || property.rentPrice,
        bedrooms: req.body.bedrooms || property.bedrooms,
        bathrooms: req.body.bathrooms || property.bathrooms,
        propertySize: req.body.propertySize || property.propertySize,
        sizeUnit: req.body.sizeUnit || property.sizeUnit,
        features: features.length > 0 ? features : property.features,
        images: images.length > 0 ? images.map((image) => ({ uri: image.secure_url })) : property.images,
        locationLatLng: type && coordinates ? { type, coordinates } : property.locationLatLng,
      },
      { new: true }
    );

    if (!updatedProperty) {
      return res.status(404).json({ error: "Property not found" });
    }

    return res.status(200).json({
      message: "Property updated successfully",
      property: updatedProperty,
    });
  } catch (error) {
    console.error("Error updating property:", error);
    
    // Check if it's a network error or if the error contains a specific message
    if (error.isAxiosError) {
      return res.status(500).json({ error: "Network error occurred", message: error.message });
    }

    return res.status(500).json({ error: "Error updating property", message: error.message });
  }
};

exports.deletePropertyController = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { propertyId } = req.params; // Get property ID from the request parameters

    // Find the property to be deleted
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Check if the user is the owner of the property
    if (property.owner.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Forbidden, not the owner of the property" });
    }

    // Delete the property
    await Property.findByIdAndDelete(propertyId);

    return res.status(200).json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error("Error deleting property:", error);
    return res
      .status(500)
      .json({ error: "Error deleting property", message: error.message });
  }
};
exports.getPropertiesByOwnerController = async (req, res) => {
  const { ownerId } = req.params;

  try {
    const properties = await Property.find({ owner: ownerId }).populate('owner');

    if (!properties.length) {
      return res.status(404).json({ message: "This owner does not have any properties listed." });
    }

    return res.status(200).json({
      message: "Properties retrieved successfully",
      properties,
    });
  } catch (error) {
    console.error("Error retrieving properties:", error);
    return res.status(500).json({ error: "Error retrieving properties", message: error.message });
  }
};


exports.getPropertiesByUserController = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Find properties by owner ID and populate the owner field
    const properties = await Property.find({ owner: req.user.id }).populate('owner');

    // Handle case where no properties are found
    if (!properties.length) {
      return res.status(200).json({
        message: "This owner does not have any properties listed.",
        properties: [], // Return an empty array
      });
    }

    return res.status(200).json({
      message: "Properties retrieved successfully",
      properties,
    });
  } catch (error) {
    console.error("Error retrieving properties:", error);
    return res.status(500).json({
      error: "Error retrieving properties",
      message: error.message,
    });
  }
};


exports.getPropertyByIdController = async (req, res) => {
  try {
    const { propertyId } = req.params; // Get property ID from the request parameters

    // Find the property by ID and populate the owner field
    const property = await Property.findById(propertyId).populate('owner');

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    return res.status(200).json({
      message: "Property retrieved successfully",
      property,
    });
  } catch (error) {
    console.error("Error retrieving property:", error);
    return res.status(500).json({ error: "Error retrieving property", message: error.message });
  }
};


// Controller function for searching properties
exports.searchProperties = async function(req, res) {
  try {
    const searchParams = req.query;
    console.log('Search Params:', searchParams);

    const query = {};

    // Handle locationLatLng
    if (searchParams.longitude && searchParams.latitude && searchParams.distance) {
      const longitude = parseFloat(searchParams.longitude);
      const latitude = parseFloat(searchParams.latitude);
      const maxDistance = parseFloat(searchParams.distance) * 1000; // Convert distance to meters

      if (!isNaN(longitude) && !isNaN(latitude) && !isNaN(maxDistance)) {
        query.locationLatLng = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: maxDistance,
          },
        };
      }
    }

    // Handle category
    if (searchParams.category) {
      query.category = { $in: searchParams.category.split(',') };
    }

    // Handle minRentPrice and maxRentPrice
    if (searchParams.minRentPrice) {
      query.rentPrice = { $gte: parseInt(searchParams.minRentPrice, 10) };
    }
    if (searchParams.maxRentPrice) {
      query.rentPrice = { ...query.rentPrice, $lte: parseInt(searchParams.maxRentPrice, 10) };
    }

    // Handle bedrooms
    if (searchParams.bedrooms && !isNaN(parseInt(searchParams.bedrooms, 10))) {
      if (searchParams.bedrooms === '10_or_more') {
        query.bedrooms = { $gte: 10 };
      } else {
        query.bedrooms = parseInt(searchParams.bedrooms, 10);
      }
    }

    // Handle bathrooms
    if (searchParams.bathrooms && !isNaN(parseInt(searchParams.bathrooms, 10))) {
      if (searchParams.bathrooms === '6_or_more') {
        query.bathrooms = { $gte: 6 };
      } else {
        query.bathrooms = parseInt(searchParams.bathrooms, 10);
      }
    }

    // Handle minPropertySize and maxPropertySize
    if (searchParams.minPropertySize) {
      query.propertySize = { $gte: parseInt(searchParams.minPropertySize, 10) };
    }
    if (searchParams.maxPropertySize) {
      query.propertySize = { ...query.propertySize, $lte: parseInt(searchParams.maxPropertySize, 10) };
    }

    console.log('Constructed Query:', JSON.stringify(query, null, 2));

    // Execute the query
    const properties = await Property.find(query).exec();
    res.json(properties);
  } catch (error) {
    console.error('Error searching properties:', error);
    res.status(500).json({ message: 'An error occurred while searching for properties' });
  }
};
// Controller method to change property status to 'rented'
exports.changePropertyStatusToRentedController = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { propertyId } = req.params; // Get property ID from the request parameters

    // Find the existing property
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Update the property status to 'rented'
    property.status = 'rented';
    await property.save();

    return res.status(200).json({
      message: "Property status updated to rented successfully",
      property,
    });
  } catch (error) {
    console.error("Error updating property status:", error);
    return res.status(500).json({ error: "Error updating property status", message: error.message });
  }
};
exports.setRentedByController = async (req, res) => {
  const { propertyId, tenantId } = req.body;

  // Validate input
  if (!propertyId || !tenantId) {
    return res.status(400).json({ error: "Property ID and Tenant ID are required" });
  }

  try {
    // Find the property by ID and update the rentedBy field
    const property = await Property.findByIdAndUpdate(
      propertyId,
      { rentedBy: tenantId },
      { new: true, runValidators: true } // Returns the updated property
    );

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    return res.status(200).json({
      message: "Rented by field updated successfully",
      property,
    });
  } catch (error) {
    console.error("Error updating rentedBy:", error);
    return res.status(500).json({ error: "Error updating rentedBy field", message: error.message });
  }
};

exports.getRentedPropertyByTenantIdController = async (req, res) => {
  const { tenantId } = req.params; // Get tenant ID from the request parameters

  try {
    // Find the property where the rentedBy field matches the tenant's ID
    const rentedProperty = await Property.findOne({ rentedBy: tenantId }).populate('rentedBy');

    // If no rented property is found, return a response without an error status
    if (!rentedProperty) {
      return res.status(200).json({
        message: "No property rented by this tenant.",
        property: null,
      });
    }

    return res.status(200).json({
      message: "Rented property retrieved successfully",
      property: rentedProperty,
    });
  } catch (error) {
    console.error("Error retrieving rented property:", error);
    return res.status(500).json({
      message: "Error retrieving rented property",
      error: error.message || "Internal Server Error",
    });
  }
};


 // Ensure this is the correct path to your model

exports.searchPropertiesByIds = async (req, res) => {
  try {
    console.log('Request Body:', req.body);

    // Extract propertyIds from request body
    const propertyIds = req.body.ids;  // Adjusted to match frontend
    console.log('Incoming propertyIds:', propertyIds);

    // Validate propertyIds
    if (!propertyIds || !Array.isArray(propertyIds)) {
      console.error('Invalid property IDs format:', propertyIds);
      return res.status(400).json({ message: 'Invalid property IDs format. Please provide an array of IDs.' });
    }

    // Convert and validate each ObjectId
    const objectIds = propertyIds.map(id => {
      console.log('Checking ObjectId validity for:', id);
      if (!mongoose.Types.ObjectId.isValid(id)) {
        console.error(`Invalid ObjectId: ${id}`);
        throw new Error(`Invalid ObjectId: ${id}`);
      }
      return new mongoose.Types.ObjectId(id);
    });

    // Fetch properties
    const properties = await Property.find({
      _id: { $in: objectIds },
      status: 'listed',
    });

    console.log('Fetched properties:', properties);
    return res.status(200).json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    return res.status(500).json({ error: 'Error retrieving properties', message: error.message });
  }
};
